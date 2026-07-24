"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recordVersement } from "@/lib/actions";
import SearchableSelect from "@/components/searchable-select";
import { formatFCFA, groupDigits } from "@/lib/format";
import type { VersementParty } from "@/lib/queries";

const toNum = (s: string) =>
  parseFloat(s.replace(/\s/g, "").replace(",", ".")) || 0;

export default function VersementForm({ parties }: { parties: VersementParty[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  // Change à chaque enregistrement : remonte les champs vidés.
  const [resetKey, setResetKey] = useState(0);
  const [state, formAction, pending] = useActionState(recordVersement, null);
  const router = useRouter();
  const result = state as { ok?: boolean; error?: string } | null;

  // Après un enregistrement réussi : on reste sur la page, le formulaire
  // repart vierge et les dettes affichées sont rafraîchies.
  useEffect(() => {
    if (result?.ok) {
      setAmount("");
      setSelectedId(null);
      setResetKey((k) => k + 1);
      router.refresh();
    }
  }, [result, router]);

  const selected = parties.find((p) => p.id === selectedId) ?? null;

  // Options : tous les clients
  const options = parties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    group: "Clients",
  }));

  const debtAmount = selected ? selected.oweYou : 0;
  const transactions = selected ? selected.debt : [];

  function onAmountChange(v: string) {
    const digits = v.replace(/[^\d]/g, ""); // que des chiffres
    // Plafond : jamais plus que la dette.
    if (selected && debtAmount > 0 && toNum(digits) > debtAmount) {
      setAmount(String(Math.round(debtAmount)));
    } else {
      setAmount(digits);
    }
  }

  const inputCls = "w-full rounded-lg border border-border px-3 py-2 text-sm bg-white";

  return (
    <form action={formAction} className="card p-5 max-w-lg space-y-4">
      {selectedId && (
        <input type="hidden" name="clientId" value={selectedId} />
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Client *
        </label>
        <SearchableSelect
          key={`client-${resetKey}`}
          name="_client_display"
          options={options}
          onChange={(o) => {
            setSelectedId(o?.id ?? null);
            setAmount("");
          }}
          placeholder="Rechercher un client…"
        />
      </div>

      {/* Dette du client sélectionné, dépliable */}
      {selected && (
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              Elle te doit
            </span>
            <span
              className={`text-lg font-bold ${debtAmount > 0.5 ? "text-danger" : "text-primary"}`}
            >
              {debtAmount > 0.5 ? formatFCFA(debtAmount) : "Rien / soldé"}
            </span>
          </div>

          {transactions.length > 0 && (
            <details className="mt-2 group">
              <summary className="cursor-pointer list-none text-xs text-primary flex items-center gap-1">
                <span className="group-open:rotate-180 transition-transform">▾</span>
                Voir les {transactions.length} transaction(s) concernée(s)
              </summary>
              <ul className="mt-2 divide-y divide-border border-t border-border">
                {transactions.map((t) => (
                  <li key={t.id} className="flex justify-between py-2 text-xs">
                    <span className="text-muted">{t.date}</span>
                    <span>
                      {formatFCFA(t.total)} ·{" "}
                      <span className="text-danger font-medium">
                        reste {formatFCFA(t.remaining)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Montant *</label>
          <input
            name="amount"
            inputMode="numeric"
            required
            disabled={!selected || debtAmount <= 0.5}
            value={groupDigits(amount)}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={
              !selected
                ? "Choisir d'abord…"
                : debtAmount <= 0.5
                  ? "Rien à régler"
                  : "Ex. 50 000"
            }
            className={`${inputCls}${!selected || debtAmount <= 0.5 ? " opacity-50" : ""}`}
          />
          {selected && debtAmount > 0.5 && (
            <p className="text-[11px] text-muted mt-1">
              Max : {formatFCFA(debtAmount)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Moyen</label>
          <select name="method" className={inputCls}>
            <option value="espèces">Espèces</option>
            <option value="mobile money">Mobile money</option>
            <option value="virement">Virement</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Note (optionnel)</label>
        {/* key : champ non contrôlé, il faut le remonter pour le vider. */}
        <input
          key={resetKey}
          name="note"
          placeholder="Ex. tranche…"
          className={inputCls}
        />
      </div>

      <button
        disabled={!selected || pending}
        className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? "..." : "Enregistrer le versement"}
      </button>

      {result?.error && (
        <p className="rounded-lg bg-danger/10 text-danger px-3 py-2 text-sm">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p className="rounded-lg bg-primary/10 text-primary px-3 py-2 text-sm font-medium">
          ✓ Versement enregistré
        </p>
      )}
    </form>
  );
}
