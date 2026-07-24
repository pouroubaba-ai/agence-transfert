"use client";

import { useState } from "react";
import { addPayment } from "@/lib/actions";
import { formatFCFA, groupDigits } from "@/lib/format";

const digits = (v: string) => v.replace(/[^\d]/g, "");
const toNum = (s: string) => parseFloat(s.replace(/\s/g, "")) || 0;

/**
 * Encaissement d'une tranche sur un transfert précis.
 * Le montant ne peut jamais dépasser ce qui reste dû sur ce transfert.
 */
export default function TrancheForm({
  transferId,
  clientId,
  remaining,
}: {
  transferId: string;
  clientId: string | null;
  remaining: number;
}) {
  const [amount, setAmount] = useState("");

  function onAmount(v: string) {
    const d = digits(v);
    setAmount(remaining > 0 && toNum(d) > remaining ? String(Math.round(remaining)) : d);
  }

  return (
    <form
      action={addPayment}
      className="mt-4 space-y-3 border-t border-border pt-4"
    >
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      <input type="hidden" name="transferId" value={transferId} />
      <input type="hidden" name="redirectTo" value={`/transferts/${transferId}`} />

      <div>
        <input
          name="amount"
          inputMode="numeric"
          required
          value={groupDigits(amount)}
          onChange={(e) => onAmount(e.target.value)}
          placeholder="Montant de la tranche"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
        <p className="mt-1 text-[11px] text-muted">
          Max : {formatFCFA(remaining)}
        </p>
      </div>

      <select
        name="method"
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
      >
        <option value="espèces">Espèces</option>
        <option value="mobile money">Mobile money</option>
        <option value="virement">Virement</option>
      </select>

      <button className="btn-primary w-full rounded-lg px-4 py-2 text-sm font-semibold">
        Encaisser une tranche
      </button>
    </form>
  );
}
