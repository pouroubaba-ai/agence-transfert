import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientBalance, allocatedAmount } from "@/lib/ledger";
import { formatDate } from "@/lib/format";
import { PageHeader, BalanceTag } from "@/components/ui";
import ClientFile from "@/components/client-file";
import FicheVersement from "@/components/fiche-versement";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const client = await prisma.client.findFirst({
    where: { id, agencyId: user.agencyId },
    include: {
      transfers: {
        include: {
          channel: true,
          allocations: { include: { payment: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) notFound();

  const balance = clientBalance(client.transfers, client.payments);
  const active = client.transfers.filter((t) => t.status !== "ANNULE");

  const totals = {
    transferred: active.reduce((s, t) => s + t.amount, 0),
    commissions: active.reduce((s, t) => s + t.fee, 0),
    paid: client.payments
      .filter((p) => p.direction === "ENTREE" && p.status !== "ANNULE")
      .reduce((s, p) => s + p.amount, 0),
    remaining: balance,
  };

  const transfers = client.transfers.map((t) => {
    const paid = allocatedAmount(t.allocations);
    return {
      id: t.id,
      date: formatDate(t.createdAt),
      dateISO: t.createdAt.toISOString(),
      amount: t.amount,
      fee: t.fee,
      withdrawalFee: t.withdrawalFee,
      total: t.total,
      paid,
      remaining: t.total - paid,
      status: t.status,
      channelName: t.channel.name,
      // Imputations de versements sur ce transfert précis.
      payments: t.allocations.map((a) => ({
        id: a.id,
        date: formatDate(a.payment.createdAt),
        dateISO: a.payment.createdAt.toISOString(),
        amount: a.amount,
        method: a.payment.method,
        status: a.payment.status,
      })),
    };
  });

  const payments = client.payments.map((p) => ({
    id: p.id,
    date: formatDate(p.createdAt),
    dateISO: p.createdAt.toISOString(),
    amount: p.amount,
    method: p.method,
    status: p.status,
  }));

  return (
    <div>
      <Link href="/clients" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Clients
      </Link>
      <PageHeader
        title={client.name}
        subtitle={client.phone ?? undefined}
        action={
          <div className="text-right">
            <p className="text-xs text-muted mb-1">Solde</p>
            <BalanceTag amount={balance} positiveLabel="doit à l'agence" negativeLabel="d'avance" />
          </div>
        }
      />

      <div className="mb-6">
        <FicheVersement
          partyType="client"
          partyId={client.id}
          oweYou={Math.max(balance, 0)}
          youOwe={0}
        />
      </div>

      <ClientFile totals={totals} transfers={transfers} payments={payments} />
    </div>
  );
}
