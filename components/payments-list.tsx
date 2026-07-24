"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/format";
import { EmptyState } from "@/components/ui";
import SearchBox from "@/components/search-box";
import DateFilter, { inRange, type DateRange } from "@/components/date-filter";

export type PaymentRow = {
  id: string;
  date: string;
  iso: string;
  isIn: boolean;
  partyName: string;
  partyHref: string | null;
  method: string | null;
  amount: number;
  status: string;
  // Dettes couvertes par ce versement (une seule ligne, plusieurs imputations).
  allocations: { id: string; label: string; amount: number }[];
};

export default function PaymentsList({ rows }: { rows: PaymentRow[] }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const term = q.trim().toLowerCase();

  const hasAnnulled = rows.some((r) => r.status === "ANNULE");

  const filtered = rows
    .filter((r) => !term || r.partyName.toLowerCase().includes(term))
    .filter((r) => inRange(r.iso, range))
    .filter((r) => showCancelled || r.status !== "ANNULE");

  return (
    <div>
      <div className="mb-4 space-y-3">
        <SearchBox
          value={q}
          onChange={setQ}
          suggestions={[
            ...new Set(rows.map((r) => r.partyName).filter((n) => n !== "—")),
          ].sort()}
          placeholder="Rechercher (client)…"
        />
        <DateFilter onChange={setRange} />
        {hasAnnulled && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="rounded"
            />
            <span className="text-muted">Afficher les versements annulés</span>
          </label>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun versement" hint="Aucun résultat pour cette recherche." />
      ) : (
        <>
          {/* Téléphone : une carte par versement. */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {r.partyHref ? (
                        <Link href={r.partyHref} className="hover:text-primary">
                          {r.partyName}
                        </Link>
                      ) : (
                        r.partyName
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {r.date} · {r.method ?? "—"}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold">
                    {formatFCFA(r.amount)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.isIn ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {r.isIn ? "Encaissement" : "Règlement"}
                  </span>
                  {r.allocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"
                    >
                      ! {r.allocations.length} dettes
                    </button>
                  )}
                </div>

                {openId === r.id && (
                  <ul className="mt-3 space-y-1 border-t border-border pt-3">
                    {r.allocations.map((a) => (
                      <li
                        key={a.id}
                        className="flex justify-between gap-3 text-xs text-muted"
                      >
                        <span className="truncate">{a.label}</span>
                        <span className="shrink-0 font-medium">
                          {formatFCFA(a.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>

          <div className="card hidden overflow-hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Type</th>
                  <th className="px-5 py-3 font-medium">Concerne</th>
                  <th className="px-5 py-3 font-medium">Moyen</th>
                  <th className="px-5 py-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-background"
                  >
                    <td className="px-5 py-3 text-muted whitespace-nowrap">{r.date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.isIn
                            ? "bg-primary/10 text-primary"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {r.isIn ? "Encaissement" : "Règlement"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {r.allocations.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenId(openId === r.id ? null : r.id)
                          }
                          title="Ce versement couvre plusieurs dettes"
                          className="mr-1 font-bold text-warning"
                        >
                          !
                        </button>
                      )}
                      {r.partyHref ? (
                        <Link href={r.partyHref} className="hover:text-primary">
                          {r.partyName}
                        </Link>
                      ) : (
                        r.partyName
                      )}
                      {openId === r.id && (
                        <ul className="mt-1 space-y-0.5">
                          {r.allocations.map((a) => (
                            <li key={a.id} className="text-[11px] text-muted">
                              {a.label} → {formatFCFA(a.amount)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted">{r.method ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-semibold whitespace-nowrap">
                      {formatFCFA(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
    </div>
  );
}
