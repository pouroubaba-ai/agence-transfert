"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { requireUser, setSession, clearSession } from "./auth";
import {
  computeFee,
  allocatedAmount,
  allocatePayment,
  clientBalance,
} from "./ledger";

/**
 * Impute un versement (ENTREE) sur les dettes ouvertes du client, de la
 * plus ancienne à la plus récente. Un seul versement peut couvrir plusieurs
 * dettes : on garde une seule ligne, avec le détail des imputations.
 */
async function createAllocations(opts: {
  paymentId: string;
  agencyId: string;
  clientId: string;
  amount: number;
  preferTransferId?: string | null;
}) {
  const { paymentId, agencyId, clientId, amount, preferTransferId } = opts;

  const transfers = await prisma.transfer.findMany({
    where: {
      agencyId,
      clientId,
      status: { notIn: ["ANNULE"] },
    },
    include: { allocations: true },
    orderBy: { createdAt: "asc" },
  });

  let debts = transfers
    .map((t) => ({ id: t.id, remaining: t.total - allocatedAmount(t.allocations) }))
    .filter((d) => d.remaining > 0.005);

  if (preferTransferId) {
    debts = [
      ...debts.filter((d) => d.id === preferTransferId),
      ...debts.filter((d) => d.id !== preferTransferId),
    ];
  }

  for (const a of allocatePayment(amount, debts)) {
    await prisma.paymentAllocation.create({
      data: { paymentId, transferId: a.transferId, amount: a.amount },
    });
  }
}

function num(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function str(v: FormDataEntryValue | null): string {
  return String(v ?? "").trim();
}
function optStr(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s === "" ? null : s;
}

// ---------- Authentification ----------

export async function login(_prev: unknown, formData: FormData) {
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return { error: "Identifiants invalides." };
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return { error: "Identifiants invalides." };
  await setSession(user.id);
  redirect("/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function signup(_prev: unknown, formData: FormData) {
  const agencyName = str(formData.get("agencyName"));
  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = str(formData.get("password"));

  if (!agencyName) return { error: "Le nom de l'agence est requis." };
  if (!name) return { error: "Votre nom est requis." };
  if (!email) return { error: "L'email est requis." };
  if (!password || password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Cet email est déjà utilisé." };

  // Créer l'agence
  const agency = await prisma.agency.create({
    data: { name: agencyName },
  });

  // Créer le compte propriétaire
  const user = await prisma.user.create({
    data: {
      agencyId: agency.id,
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "OWNER",
      canManageFees: true,
      canDelete: true,
    },
  });

  // Créer une agence settings par défaut
  await prisma.agencySettings.create({
    data: {
      agencyId: agency.id,
    },
  });

  // Créer le canal Orange Money par défaut
  await prisma.channel.create({
    data: {
      agencyId: agency.id,
      name: "Orange Money",
      generalFeeBase: 1000,
      generalFeePerBase: 20,
      clientFeeBase: 1000,
      clientFeePerBase: 20,
    },
  });

  // Créer le client par défaut "Client"
  await prisma.client.create({
    data: {
      agencyId: agency.id,
      name: "Client",
      note: "Client par défaut (comptoir)",
    },
  });

  // Se connecter automatiquement
  await setSession(user.id);
  redirect("/");
}

// ---------- Clients ----------

export async function createClient(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const name = str(formData.get("name"));
  if (!name) return { error: "Le nom est requis." };
  const existing = await prisma.client.findMany({
    where: { agencyId: user.agencyId },
    select: { name: true },
  });
  if (existing.some((c) => c.name.trim().toLowerCase() === name.toLowerCase())) {
    return { error: `Un client nommé « ${name} » existe déjà.` };
  }
  await prisma.client.create({
    data: {
      agencyId: user.agencyId,
      name,
      phone: optStr(formData.get("phone")),
      note: optStr(formData.get("note")),
    },
  });
  revalidatePath("/clients");
  return { ok: true };
}

// ---------- Canaux ----------

// Extrait la configuration des frais depuis le formulaire d'un canal.
function readChannelFees(formData: FormData) {
  const optNum = (k: string) => {
    const s = str(formData.get(k));
    return s === "" ? null : num(formData.get(k));
  };
  return {
    feeMode: "GENERAL",
    generalFeeBase: optNum("feeBase"),
    generalFeePerBase: optNum("feePerBase"),
    clientFeeBase: optNum("feeBase"),
    clientFeePerBase: optNum("feePerBase"),
  };
}

export async function createChannel(formData: FormData) {
  const user = await requireUser();
  await prisma.channel.create({
    data: {
      agencyId: user.agencyId,
      name: str(formData.get("name")),
      ...readChannelFees(formData),
    },
  });
  revalidatePath("/canaux");
}

export async function updateChannel(formData: FormData) {
  const user = await requireUser();
  const id = str(formData.get("id"));
  const channel = await prisma.channel.findFirst({
    where: { id, agencyId: user.agencyId },
  });
  if (!channel) return;
  await prisma.channel.update({
    where: { id },
    data: {
      name: str(formData.get("name")) || channel.name,
      ...readChannelFees(formData),
    },
  });
  revalidatePath("/canaux");
}

export async function toggleChannel(formData: FormData) {
  const user = await requireUser();
  const id = str(formData.get("id"));
  const channel = await prisma.channel.findFirst({
    where: { id, agencyId: user.agencyId },
  });
  if (channel) {
    await prisma.channel.update({
      where: { id },
      data: { active: !channel.active },
    });
  }
  revalidatePath("/canaux");
}

export async function deleteChannel(formData: FormData) {
  const user = await requireUser();
  const id = str(formData.get("id"));
  const channel = await prisma.channel.findFirst({
    where: { id, agencyId: user.agencyId },
  });
  if (!channel) throw new Error("Canal introuvable.");
  if (channel.name.toLowerCase() === "orange money") {
    throw new Error("Impossible de supprimer Orange Money, c'est le canal par défaut.");
  }
  const transferCount = await prisma.transfer.count({
    where: { channelId: id },
  });
  if (transferCount > 0) {
    throw new Error(`Impossible de supprimer ce canal : ${transferCount} transfert(s) l'utilise(nt).`);
  }
  await prisma.channel.delete({ where: { id } });
  revalidatePath("/canaux");
}

// ---------- Transferts ----------

export async function createTransfer(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const amount = num(formData.get("amount"));
  if (amount <= 0) return { error: "Le montant du transfert est requis." };

  let clientId = optStr(formData.get("party"));
  const createNewClient = formData.get("createNewClient") === "true";
  const newClientName = optStr(formData.get("newClientName"));

  // Si c'est un nouveau client, le créer d'abord
  if (createNewClient && newClientName) {
    const newClient = await prisma.client.create({
      data: {
        agencyId: user.agencyId,
        name: newClientName,
      },
    });
    clientId = newClient.id;
  } else if (!clientId) {
    return { error: "Choisis un client." };
  }

  if (!str(formData.get("channelId"))) return { error: "Choisis un canal." };

  // La règle de frais provient du canal (feeBase/feePerBase, éventuellement
  // modifiés pour ce transfert). Un montant manuel désactive la règle.
  const manualFee = formData.get("fee");
  const hasManual = str(manualFee) !== "";

  let fee = 0;
  let feeBase: number | null = null;
  let feePerBase: number | null = null;
  if (hasManual) {
    fee = num(manualFee);
  } else {
    feeBase = str(formData.get("feeBase")) === "" ? null : num(formData.get("feeBase"));
    feePerBase =
      str(formData.get("feePerBase")) === "" ? null : num(formData.get("feePerBase"));
    fee =
      feeBase != null && feePerBase != null
        ? computeFee(amount, { base: feeBase, feePerBase })
        : 0;
  }

  // Garde-fou : plafond de l'agent
  if (user.maxAmount != null && amount > user.maxAmount) {
    throw new Error(
      `Ce transfert dépasse votre plafond autorisé (${user.maxAmount}).`
    );
  }

  const transfer = await prisma.transfer.create({
    data: {
      agencyId: user.agencyId,
      clientId,
      channelId: str(formData.get("channelId")),
      amount,
      fee,
      total: amount + fee,
      feeBase,
      feePerBase,
      feeManual: hasManual,
      beneficiaryName: optStr(formData.get("beneficiaryName")),
      beneficiaryPhone: optStr(formData.get("beneficiaryPhone")),
      beneficiaryCountry: optStr(formData.get("beneficiaryCountry")),
      status: str(formData.get("status")) || "EN_ATTENTE",
      note: optStr(formData.get("note")),
      createdById: user.id,
    },
  });

  // Versement initial éventuel (première tranche payée à la création)
  const initial = num(formData.get("initialPayment"));
  if (initial > 0 && transfer.clientId) {
    const p = await prisma.payment.create({
      data: {
        agencyId: user.agencyId,
        direction: "ENTREE",
        clientId: transfer.clientId,
        transferId: transfer.id,
        amount: initial,
        method: optStr(formData.get("initialMethod")),
        createdById: user.id,
      },
    });
    await createAllocations({
      paymentId: p.id,
      agencyId: user.agencyId,
      clientId: transfer.clientId,
      amount: initial,
      preferTransferId: transfer.id,
    });
  }

  revalidatePath("/transferts");
  return { ok: true, id: transfer.id };
}

export async function updateTransferStatus(formData: FormData) {
  const user = await requireUser();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  const transfer = await prisma.transfer.findFirst({
    where: { id, agencyId: user.agencyId },
  });
  if (transfer) {
    await prisma.transfer.update({ where: { id }, data: { status } });
  }
  revalidatePath(`/transferts/${id}`);
  revalidatePath("/transferts");
}

export async function cancelTransfer(transferId: string) {
  const user = await requireUser();
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, agencyId: user.agencyId },
    include: { payments: true },
  });
  if (!transfer) return { error: "Transfert introuvable." };
  if (transfer.status === "ANNULE") return { error: "Ce transfert est déjà annulé." };

  // Annuler le transfert
  await prisma.transfer.update({
    where: { id: transferId },
    data: { status: "ANNULE" },
  });

  // Annuler tous les versements ENTREE associés à ce transfert
  const paymentsToCancel = transfer.payments.filter((p) => p.direction === "ENTREE");
  for (const p of paymentsToCancel) {
    await prisma.payment.update({
      where: { id: p.id },
      data: { status: "ANNULE" },
    });
  }

  revalidatePath(`/transferts/${transferId}`);
  revalidatePath("/transferts");
  const clientId = transfer.clientId;
  if (clientId) revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

// ---------- Versements ----------

/** Dette restante d'un client, calculée depuis le grand livre. */
async function clientAmountDue(
  agencyId: string,
  clientId: string
): Promise<number> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, agencyId },
    include: { transfers: true, payments: true },
  });
  if (!client) return 0;
  return Math.max(clientBalance(client.transfers, client.payments), 0);
}

export async function recordVersement(_prev: unknown, formData: FormData) {
  const user = await requireUser();
  const amount = num(formData.get("amount"));
  if (amount <= 0) return { error: "Le montant est requis." };

  const clientId = optStr(formData.get("clientId"));
  if (!clientId) return { error: "Choisis un client." };

  // Un versement ne peut jamais dépasser la dette.
  const due = await clientAmountDue(user.agencyId, clientId);
  if (amount > due + 0.5) {
    return {
      error:
        due <= 0.5
          ? "Il n'y a rien à régler."
          : `Le versement dépasse la dette (${Math.round(due)} FCFA au maximum).`,
    };
  }

  const payment = await prisma.payment.create({
    data: {
      agencyId: user.agencyId,
      direction: "ENTREE",
      clientId,
      amount,
      method: optStr(formData.get("method")),
      note: optStr(formData.get("note")),
      createdById: user.id,
    },
  });

  await createAllocations({
    paymentId: payment.id,
    agencyId: user.agencyId,
    clientId,
    amount,
  });

  revalidatePath("/versements");
  return { ok: true };
}

export async function addPayment(formData: FormData) {
  const user = await requireUser();

  const clientId = optStr(formData.get("clientId"));
  if (!clientId) return;

  const transferId = optStr(formData.get("transferId"));
  const amount = num(formData.get("amount"));
  if (amount <= 0) return;

  // Une tranche ne peut pas dépasser ce qui reste dû sur le transfert visé.
  if (transferId) {
    const transfer = await prisma.transfer.findFirst({
      where: { id: transferId, agencyId: user.agencyId },
      include: { allocations: true },
    });
    if (!transfer) return;
    const remaining = transfer.total - allocatedAmount(transfer.allocations);
    if (amount > remaining + 0.5) return;
  }

  const payment = await prisma.payment.create({
    data: {
      agencyId: user.agencyId,
      direction: "ENTREE",
      clientId,
      transferId,
      amount,
      method: optStr(formData.get("method")),
      note: optStr(formData.get("note")),
      createdById: user.id,
    },
  });

  await createAllocations({
    paymentId: payment.id,
    agencyId: user.agencyId,
    clientId,
    amount,
    preferTransferId: transferId,
  });

  revalidatePath("/versements");
  const redirectTo = optStr(formData.get("redirectTo"));
  if (redirectTo) redirect(redirectTo);
}

// ---------- Agents ----------

export async function createAgent(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "OWNER") throw new Error("Réservé au patron.");
  const email = str(formData.get("email")).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Cet email est déjà utilisé.");
  const maxAmountRaw = str(formData.get("maxAmount"));
  await prisma.user.create({
    data: {
      agencyId: user.agencyId,
      name: str(formData.get("name")),
      email,
      password: await bcrypt.hash(str(formData.get("password")) || "agent123", 10),
      role: "AGENT",
      maxAmount: maxAmountRaw === "" ? null : num(formData.get("maxAmount")),
      canManageFees: formData.get("canManageFees") === "on",
      canDelete: formData.get("canDelete") === "on",
    },
  });
  revalidatePath("/agents");
}

export async function toggleAgent(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "OWNER") return;
  const id = str(formData.get("id"));
  if (id === user.id) return; // ne pas se désactiver soi-même
  const target = await prisma.user.findFirst({
    where: { id, agencyId: user.agencyId },
  });
  if (target) {
    await prisma.user.update({ where: { id }, data: { active: !target.active } });
  }
  revalidatePath("/agents");
}

export async function updateUSSDConfig(formData: FormData) {
  const user = await requireUser();
  const ussdPrefix = optStr(formData.get("ussdPrefix")) || "#145#1";
  const ussdPassword = optStr(formData.get("ussdPassword"));
  const ussdSuffix = optStr(formData.get("ussdSuffix")) || "#";
  const settingsPin = optStr(formData.get("settingsPin")) || "1234";

  await prisma.agencySettings.upsert({
    where: { agencyId: user.agencyId },
    update: {
      ussdPrefix,
      ussdPassword,
      ussdSuffix,
      settingsPin,
    },
    create: {
      agencyId: user.agencyId,
      ussdPrefix,
      ussdPassword,
      ussdSuffix,
      settingsPin,
    },
  });

  revalidatePath("/parametres");
}

