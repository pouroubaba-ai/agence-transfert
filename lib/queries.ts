import { prisma } from "./prisma";
import {
  clientBalance,
  allocatedAmount,
} from "./ledger";
import { formatDateShort } from "./format";

export type VersementParty = {
  id: string;
  name: string;
  type: "client";
  oweYou: number; // ce que le client DOIT à l'agence
  youOwe: number; // toujours 0
  // Transferts où il te doit (encaissement), avec le reste dû.
  debt: { id: string; total: number; remaining: number; date: string }[];
};

/** Clients avec leurs dettes et transactions. */
export async function getVersementParties(
  agencyId: string
): Promise<VersementParty[]> {
  const clients = await prisma.client.findMany({
    where: { agencyId },
    include: { transfers: { include: { allocations: true } }, payments: true },
    orderBy: { name: "asc" },
  });

  return clients.map((c) => {
    const bal = clientBalance(c.transfers, c.payments);
    return {
      id: c.id,
      name: c.name,
      type: "client" as const,
      oweYou: Math.max(bal, 0),
      youOwe: 0,
      debt: c.transfers
        .filter((t) => t.status !== "ANNULE")
        .map((t) => ({
          id: t.id,
          total: t.total,
          remaining: t.total - allocatedAmount(t.allocations),
          date: formatDateShort(t.createdAt),
        }))
        .filter((t) => t.remaining > 0.5),
    };
  });
}

export async function getClientsWithBalance(agencyId: string) {
  const clients = await prisma.client.findMany({
    where: { agencyId },
    include: { transfers: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return clients.map((c) => ({
    ...c,
    balance: clientBalance(c.transfers, c.payments),
    transferCount: c.transfers.length,
  }));
}


export type Range = { from: Date | null; to: Date | null };

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Clause Prisma de période (bornes incluses) ; vide si aucune période. */
function dateWhere(r?: Range) {
  if (!r || (!r.from && !r.to)) return {};
  return {
    createdAt: {
      ...(r.from ? { gte: r.from } : {}),
      ...(r.to ? { lte: r.to } : {}),
    },
  };
}


/**
 * Données du tableau de bord : indicateurs et répartitions, sur une période
 * optionnelle. Sans période, c'est la situation générale depuis le début.
 */
export async function getDashboardData(agencyId: string, range?: Range) {
  const when = dateWhere(range);
  const [transfers, payments, clientList] = await Promise.all([
    prisma.transfer.findMany({
      where: { agencyId, status: { notIn: ["ANNULE"] }, ...when },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { agencyId, status: { notIn: ["ANNULE"] }, ...when },
      orderBy: { createdAt: "asc" },
    }),
    prisma.client.findMany({
      where: { agencyId },
      select: { id: true, name: true },
    }),
  ]);

  // --- Clients : ce que chacun a pris, payé, et ce qui reste dû.
  const clientDetails = clientList
    .map((c) => {
      const total = sum(
        transfers.filter((t) => t.clientId === c.id).map((t) => t.total)
      );
      const paid = sum(
        payments
          .filter((p) => p.clientId === c.id && p.direction === "ENTREE")
          .map((p) => p.amount)
      );
      return { id: c.id, name: c.name, total, paid, remaining: total - paid };
    })
    .filter((c) => c.remaining > 0.5)
    .sort((a, b) => b.remaining - a.remaining);
  const clientsOwe = sum(clientDetails.map((c) => c.remaining));

  const transferVolume = sum(transfers.map((t) => t.amount));
  const commissionEarned = sum(transfers.map((t) => t.fee));

  return {
    // Indicateurs
    transferVolume,
    commissionEarned,
    transferCount: transfers.length,
    owedToMe: clientsOwe,
    clientsOwe,
    owedByPartners: 0,
    owedToPartners: 0,

    // Ce que les clients me doivent
    debtSplit: [
      {
        name: "Clients",
        color: "#f59e0b",
        value: clientsOwe,
        details: clientDetails,
      },
    ],

    volumeSplit: [
      {
        name: "Transferts",
        color: "#2563eb",
        value: transferVolume,
        gain: commissionEarned,
      },
    ],
  };
}

export type ReportData = Awaited<ReturnType<typeof getReportData>>;

/**
 * Données du rapport PDF : situation générale, sans filtre de période.
 * Tout est recalculé depuis le ledger pour coller à ce qu'affiche l'écran.
 */
export async function getReportData(agencyId: string) {
  const [agency, transfers, payments, clientList, dash] =
    await Promise.all([
      prisma.agency.findUnique({ where: { id: agencyId }, select: { name: true } }),
      prisma.transfer.findMany({
        where: { agencyId, status: { notIn: ["ANNULE"] } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({ where: { agencyId, status: { notIn: ["ANNULE"] } }, orderBy: { createdAt: "asc" } }),
      prisma.client.findMany({
        where: { agencyId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      getDashboardData(agencyId),
    ]);

  // Les listes sont triées par date : le dernier élément est le plus récent.
  const lastDate = <T extends { createdAt: Date }>(xs: T[]) =>
    xs.length ? formatDateShort(xs[xs.length - 1].createdAt) : "—";

  const clients = clientList
    .map((c) => {
      const ts = transfers.filter((t) => t.clientId === c.id);
      const ps = payments.filter(
        (p) => p.clientId === c.id && p.direction === "ENTREE"
      );
      const taken = sum(ts.map((t) => t.total));
      const paid = sum(ps.map((p) => p.amount));
      return {
        name: c.name,
        taken,
        paid,
        remaining: taken - paid,
        lastTransfer: lastDate(ts),
        lastPayment: lastDate(ps),
      };
    })
    .filter((c) => c.remaining > 0.5)
    .sort((a, b) => b.remaining - a.remaining);

  return {
    agencyName: agency?.name ?? "Agence",
    generatedAt: new Date(),
    indicators: {
      transferVolume: dash.transferVolume,
      commissionEarned: dash.commissionEarned,
      transferCount: dash.transferCount,
      owedToMe: dash.owedToMe,
      clientsOwe: dash.clientsOwe,
      owedByPartners: 0,
      owedToPartners: 0,
    },
    clients,
    partnersTheyOwe: [],
    partnersIOwe: [],
  };
}
