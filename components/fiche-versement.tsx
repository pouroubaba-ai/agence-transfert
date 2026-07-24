"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recordVersement } from "@/lib/actions";
import { formatFCFA, groupDigits } from "@/lib/format";
import Modal from "@/components/modal";

const digits = (v: string) => v.replace(/[^\d]/g, "");
const toNum = (s: string) => parseFloat(s.replace(/\s/g, "")) || 0;

/**
 * Versement depuis une fiche : le montant est réparti automatiquement sur
 * toutes les dettes du client, de la plus ancienne à la plus récente.
 */
export default function FicheVersement({
  partyType,
  partyId,
  oweYou,
  youOwe,
}: {
  partyType: "client";
  partyId: string;
  oweYou: number; // ce qu'il me doit
  youOwe: number; // toujours 0 pour les clients
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, formAction, pending] = useActionState(recordVersement, null);
  const router = useRouter();
  const result = state as { ok?: boolean; error?: string } | null;

  // Enregistré : on ferme la modale et on rafraîchit la fiche derrière.
  useEffect(() => {
    if (result?.ok) {
      setAmount("");
      setOpen(false);
      router.refresh();
    }
  }, [result, router]);

  const max = oweYou;
  const nothingDue = oweYou <= 0.5;

  function onAmount(v: string) {
    const d = digits(v);
    setAmount(max > 0 && toNum(d) > max ? String(Math.round(max)) : d);
  }

  const inputCls =
    "w-full rounded-lg border border-border px-3 py-2 text-sm bg-white";

  return (
    <>
      <button
        type="button"
        disabled={nothingDue}
        onClick={() => {
          setAmount("");
          setOpen(true);
        }}
        className="btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {nothingDue ? "Rien à régler" : "Enregistrer un versement"}
      </button>

      {open && (
        <Modal title="Nouveau versement" onClose={() => setOpen(false)}>
          <form action={formAction} className="space-y-3">
            <input type="hidden" name="clientId" value={partyId} />

            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted">
                  Montant dû
                </span>
                <span className="font-bold text-danger">{formatFCFA(max)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Le montant sera réparti automatiquement sur ses dettes, de la
                plus ancienne à la plus récente.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Montant *
              </label>
              <input
                name="amount"
                inputMode="numeric"
                required
                value={groupDigits(amount)}
                onChange={(e) => onAmount(e.target.value)}
                placeholder="Ex. 50 000"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-muted">
                Max : {formatFCFA(max)}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Moyen</label>
              <select name="method" className={inputCls}>
                <option value="espèces">Espèces</option>
                <option value="mobile money">Mobile money</option>
                <option value="virement">Virement</option>
              </select>
            </div>

            {result?.error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {result.error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted"
              >
                Annuler
              </button>
              <button
                disabled={pending}
                className="btn-primary flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {pending ? "..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
