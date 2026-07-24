"use client";

import { useState } from "react";

export type DateRange = { from: Date | null; to: Date | null };

type Preset = "all" | "today" | "week" | "month" | "year" | "custom";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeFor(p: Preset): DateRange {
  const now = new Date();
  switch (p) {
    case "today":
      return { from: startOfDay(now), to: null };
    case "week": {
      const d = startOfDay(now);
      const day = (d.getDay() + 6) % 7; // lundi = 0
      d.setDate(d.getDate() - day);
      return { from: d, to: null };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: null };
    default:
      return { from: null, to: null };
  }
}

/** Vérifie qu'une date ISO est dans la plage. */
export function inRange(iso: string, r: DateRange) {
  const d = new Date(iso);
  if (r.from && d < r.from) return false;
  if (r.to && d > r.to) return false;
  return true;
}

export default function DateFilter({
  onChange,
}: {
  onChange: (r: DateRange) => void;
}) {
  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function pick(p: Preset) {
    setPreset(p);
    if (p !== "custom") onChange(rangeFor(p));
    else applyCustom(from, to);
  }

  function applyCustom(f: string, t: string) {
    onChange({
      from: f ? startOfDay(new Date(f)) : null,
      to: t ? new Date(new Date(t).setHours(23, 59, 59, 999)) : null,
    });
  }

  const chip = (p: Preset, label: string) => (
    <button
      type="button"
      onClick={() => pick(p)}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
        preset === p ? "bg-primary text-white" : "border border-border text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {chip("all", "Tout")}
        {chip("today", "Aujourd'hui")}
        {chip("week", "Cette semaine")}
        {chip("month", "Ce mois")}
        {chip("year", "Cette année")}
        {chip("custom", "Personnalisé")}
      </div>
      {preset === "custom" && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-xs text-muted">Du</label>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              applyCustom(e.target.value, to);
            }}
            className="rounded-lg border border-border px-2 py-1 text-sm bg-white"
          />
          <label className="text-xs text-muted">au</label>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              applyCustom(from, e.target.value);
            }}
            className="rounded-lg border border-border px-2 py-1 text-sm bg-white"
          />
        </div>
      )}
    </div>
  );
}
