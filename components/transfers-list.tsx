"use client";

import { useState } from "react";
import Link from "next/link";
import { formatFCFA } from "@/lib/format";
import { StatusBadge, EmptyState } from "@/components/ui";
import SearchBox from "@/components/search-box";
import DateFilter, { inRange, type DateRange } from "@/components/date-filter";

export type TransferRow = {
  id: string;
  date: string;
  iso: string;
  partyName: string;
  channelName: string;
  amount: number;
  fee: number;
  paid: number;
  remaining: number;
  status: string;
};

export default function TransfersList({ rows }: { rows: TransferRow[] }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [showCancelled, setShowCancelled] = useState(false);
  const term = q.trim().toLowerCase();

  const hasAnnulled = rows.some((r) => r.status === "ANNULE");

  const filtered = rows
    .filter(
      (r) =>
        !term ||
        r.partyName.toLowerCase().includes(term) ||
        r.channelName.toLowerCase().includes(term)
    )
    .filter((r) => inRange(r.iso, range))
    .filter((r) => showCancelled || r.status !== "ANNULE");

  return (
    <div>
      <div className="mb-4 space-y-3">
        <SearchBox
          value={q}
          onChange={setQ}
          suggestions={[
            ...new Set(
              rows.flatMap((r) =>
                [r.partyName].filter(
                  (n): n is string => !!n && n !== "—"
                )
              )
            ),
          ].sort()}
          placeholder="Rechercher (client, canal)…"
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
            <span className="text-muted">Afficher les transferts annulés</span>
          </label>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun transfert" hint="Aucun résultat pour cette recherche." />
      ) : (
        <>
          {/* Téléphone : une carte par transfert, aucun défilement latéral. */}
          <ul className="space-y-3 sm:hidden">
            {filtered.map((r) => (
              <li key={r.id} className="card p-4">
                <Link href={`/transferts/${r.id}`} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{r.partyName}</p>
                      <p className="text-xs text-muted">
                        {r.date} · {r.channelName}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatFCFA(r.amount)}</p>
                      <p className="text-[11px] text-muted">
                        frais {formatFCFA(r.fee)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.status} />
                    {r.remaining < 1 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Payé
                      </span>
                    ) : (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                        Reste {formatFCFA(r.remaining)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                    <p className="flex justify-between gap-3">
                      <span className="text-muted">Versé</span>
                      <span className="font-medium text-primary">
                        {formatFCFA(r.paid)}
                      </span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="card hidden overflow-hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Canal</th>
                  <th className="px-5 py-3 font-medium text-right">Montant</th>
                  <th className="px-5 py-3 font-medium text-right">Frais</th>
                  <th className="px-5 py-3 font-medium text-right">Versé</th>
                  <th className="px-5 py-3 font-medium text-right">Reste dû</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
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
                      <Link
                        href={`/transferts/${r.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {r.partyName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted">{r.channelName}</td>
                    <td className="px-5 py-3 text-right font-medium whitespace-nowrap">
                      {formatFCFA(r.amount)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted whitespace-nowrap">
                      {formatFCFA(r.fee)}
                    </td>
                    <td className="px-5 py-3 text-right text-primary whitespace-nowrap">
                      {formatFCFA(r.paid)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {r.remaining < 1 ? (
                        <span className="text-primary font-medium">Payé</span>
                      ) : (
                        <span className="text-danger font-medium">
                          {formatFCFA(r.remaining)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={r.status} />
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
