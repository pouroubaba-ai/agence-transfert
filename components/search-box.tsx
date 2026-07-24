"use client";

import { useState } from "react";

/** Barre de recherche avec liste déroulante des noms, filtrée à la frappe. */
export default function SearchBox({
  value,
  onChange,
  suggestions,
  placeholder = "Rechercher…",
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const term = value.trim().toLowerCase();
  const list = suggestions.filter((s) => !term || s.toLowerCase().includes(term));

  return (
    <div className="relative">
      <input
        value={value}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
      />
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-border bg-white shadow-lg py-1">
          {list.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">Aucun résultat</li>
          ) : (
            list.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(s);
                    setOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-background"
                >
                  {s}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
