"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatFCFA } from "@/lib/format";

export type Slice = {
  name: string;
  color: string;
  value: number;
  /** Gain (+) ou sortie (−) associé au montant, affiché entre parenthèses. */
  gain?: number;
  /** Personnes concernées, révélées en cliquant sur la légende. */
  details?: {
    id: string;
    name: string;
    total: number;
    paid: number;
    remaining: number;
  }[];
};

/** Camembert (anneau) de répartition, avec le total au centre. */
export default function DonutChart({
  data,
  height = 260,
  centerLabel,
}: {
  data: Slice[];
  height?: number;
  centerLabel?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices = data.filter((d) => d.value > 0);

  if (total <= 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted"
        style={{ height }}
      >
        Rien à afficher pour l'instant.
      </div>
    );
  }

  return (
    <div>
      <div className="relative" style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatFCFA(Number(v ?? 0))}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--color-border)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Total au centre de l'anneau */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-lg font-bold">{formatFCFA(total)}</span>
          {centerLabel && (
            <span className="text-[11px] text-muted">{centerLabel}</span>
          )}
        </div>
      </div>

      {/* Légende : cliquable quand la part a un détail */}
      <ul className="mt-3 space-y-1.5">
        {data.map((d) => {
          const openable = (d.details?.length ?? 0) > 0;
          const isOpen = open === d.name;
          return (
            <li key={d.name}>
              <div
                role={openable ? "button" : undefined}
                onClick={openable ? () => setOpen(isOpen ? null : d.name) : undefined}
                className={`-mx-1 flex flex-col gap-0.5 rounded-lg px-1 py-1.5 text-sm sm:flex-row sm:items-center sm:gap-2 ${
                  openable ? "cursor-pointer hover:bg-background" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-2 sm:flex-1">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-muted">{d.name}</span>
                  {openable && (
                    <span
                      className={`text-[10px] text-primary transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  )}
                </span>
                <span className="flex items-baseline gap-1 whitespace-nowrap pl-[18px] sm:ml-auto sm:pl-0">
                  <span className="font-medium">{formatFCFA(d.value)}</span>
                  {d.gain != null && Math.abs(d.gain) >= 1 && (
                    <span
                      className={`text-xs font-semibold ${d.gain > 0 ? "text-primary" : "text-danger"}`}
                    >
                      ({d.gain > 0 ? "+" : "−"}
                      {formatFCFA(Math.abs(d.gain))})
                    </span>
                  )}
                  <span className="w-9 text-right text-xs text-muted">
                    {Math.round((d.value / total) * 100)}%
                  </span>
                </span>
              </div>

              {isOpen && (
                <>
                {/* Téléphone : une carte par personne. */}
                <ul className="mt-2 mb-1 space-y-2 sm:hidden">
                  {d.details!.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-lg border border-border p-3 text-xs"
                    >
                      <p className="mb-2 font-semibold">{p.name}</p>
                      <p className="flex justify-between gap-3">
                        <span className="text-muted">Total</span>
                        <span className="font-medium">{formatFCFA(p.total)}</span>
                      </p>
                      <p className="flex justify-between gap-3">
                        <span className="text-muted">Payé</span>
                        <span className="font-medium">{formatFCFA(p.paid)}</span>
                      </p>
                      <p className="flex justify-between gap-3">
                        <span className="text-muted">Reste</span>
                        <span className="font-semibold text-danger">
                          {formatFCFA(p.remaining)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-2 mb-1 hidden overflow-x-auto rounded-lg border border-border sm:block">
                  <table className="w-full min-w-[460px] text-xs">
                    <thead>
                      <tr className="text-muted border-b border-border">
                        <th className="px-3 py-2 text-left font-medium">Nom</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                        <th className="px-3 py-2 text-right font-medium">Payé</th>
                        <th className="px-3 py-2 text-right font-medium">Reste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.details!.map((p) => (
                        <tr key={p.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            {formatFCFA(p.total)}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap text-muted">
                            {formatFCFA(p.paid)}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap font-semibold text-danger">
                            {formatFCFA(p.remaining)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
