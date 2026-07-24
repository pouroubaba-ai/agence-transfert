// Coeur métier : calcul des frais et des soldes pour clients.
// Convention de solde :
//   - Solde CLIENT > 0  => le client DOIT de l'argent à l'agence (créance).
//   - Solde CLIENT < 0  => l'agence doit au client (avance/crédit).

/** Calcule les frais d'un transfert selon une règle de référence. */
export function computeFee(
  amount: number,
  rule: { base: number; feePerBase: number } | null | undefined
): number {
  if (!rule || rule.base <= 0) return 0;
  return (amount / rule.base) * rule.feePerBase;
}

type ChannelFees = {
  clientFeeBase?: number | null;
  clientFeePerBase?: number | null;
};

function rule(
  base: number | null | undefined,
  perBase: number | null | undefined
): { base: number; feePerBase: number } | null {
  if (base == null || perBase == null || base <= 0) return null;
  return { base, feePerBase: perBase };
}

/** Règle de frais appliquée à ce canal. */
export function channelClientFee(c: ChannelFees) {
  return rule(c.clientFeeBase, c.clientFeePerBase);
}

type TransferLite = {
  amount: number;
  total: number;
  status: string;
};

type PaymentLite = {
  direction: string; // ENTREE
  amount: number;
  status?: string; // ENREGISTRE | ANNULE — un versement annulé ne compte pas
};

/**
 * Solde d'un client = ce qu'il doit à l'agence.
 * = somme des totaux de ses transferts (hors annulés)
 *   - somme des versements ENTREE (ce qu'il a payé).
 */
export function clientBalance(
  transfers: TransferLite[],
  payments: PaymentLite[]
): number {
  const due = transfers
    .filter((t) => t.status !== "ANNULE")
    .reduce((s, t) => s + t.total, 0);
  const paid = payments
    .filter((p) => p.direction === "ENTREE" && p.status !== "ANNULE")
    .reduce((s, p) => s + p.amount, 0);
  return due - paid;
}

/** Montant déjà imputé à un transfert (somme des répartitions). */
export function allocatedAmount(allocations: { amount: number }[]): number {
  return allocations.reduce((s, a) => s + a.amount, 0);
}

/**
 * Répartit un versement sur les dettes ouvertes, de la plus ancienne à la plus
 * récente. Un versement peut ainsi couvrir plusieurs dettes d'un coup.
 */
export function allocatePayment(
  amount: number,
  debts: { id: string; remaining: number }[]
): { transferId: string; amount: number }[] {
  const out: { transferId: string; amount: number }[] = [];
  let left = amount;
  for (const d of debts) {
    if (left <= 0.005) break;
    const take = Math.min(left, d.remaining);
    if (take > 0.005) {
      out.push({ transferId: d.id, amount: take });
      left -= take;
    }
  }
  return out;
}

/** Reste à payer sur un transfert précis (total - versements rattachés). */
export function transferRemaining(
  total: number,
  payments: PaymentLite[]
): number {
  const paid = payments
    .filter((p) => p.direction === "ENTREE" && p.status !== "ANNULE")
    .reduce((s, p) => s + p.amount, 0);
  return total - paid;
}
