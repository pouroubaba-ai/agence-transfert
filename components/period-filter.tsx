"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export type Preset = "all" | "today" | "week" | "month" | "year" | "custom";

const LABELS: [Preset, string][] = [
  ["all", "Tout"],
  ["today", "Aujourd'hui"],
  ["week", "Cette semaine"],
  ["month", "Ce mois"],
  ["year", "Cette année"],
  ["custom", "Personnalisé"],
];

/**
 * Filtre de période du tableau de bord. Il écrit la période dans l'URL
 * (?p=month&from=…&to=…) : les données sont recalculées côté serveur.
 */
export default function PeriodFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = (params.get("p") ?? "all") as Preset;
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function apply(p: Preset, f = from, t = to) {
    const q = new URLSearchParams();
    if (p !== "all") q.set("p", p);
    if (p === "custom") {
      if (f) q.set("from", f);
      if (t) q.set("to", t);
    }
    router.push(q.toString() ? `/?${q}` : "/");
  }

  return (
    <div className="space-y-2 mb-6">
      <div className="flex flex-wrap gap-2">
        {LABELS.map(([p, label]) => (
          <button
            key={p}
            type="button"
            onClick={() => apply(p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              preset === p
                ? "bg-primary text-white"
                : "border border-border text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              apply("custom", e.target.value, to);
            }}
            className="rounded-lg border border-border px-2 py-1 text-sm bg-white"
          />
          <label className="text-xs text-muted">au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              apply("custom", from, e.target.value);
            }}
            className="rounded-lg border border-border px-2 py-1 text-sm bg-white"
          />
        </div>
      )}
    </div>
  );
}
