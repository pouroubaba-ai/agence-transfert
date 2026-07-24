"use client";

import { useMemo, useState } from "react";

export type SelectOption = {
  id: string;
  name: string;
  type?: string;
  group?: string; // en-tête de groupe dans la liste
};

/**
 * Liste déroulante avec recherche. Soumet la valeur choisie via un champ caché.
 * Si `encodeType`, la valeur soumise est « <type>:<id> » (sinon juste l'id).
 */
export default function SearchableSelect({
  name,
  options,
  defaultId = "",
  placeholder = "Rechercher…",
  encodeType = false,
  onChange: onChangeCallback,
}: {
  name: string;
  options: SelectOption[];
  defaultId?: string;
  placeholder?: string;
  encodeType?: boolean;
  onChange?: (opt: SelectOption | null) => void;
}) {
  const initial = options.find((o) => o.id === defaultId) ?? null;
  const [selected, setSelected] = useState<SelectOption | null>(initial);
  const [query, setQuery] = useState(initial?.name ?? "");
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);

  // Vérifie si le query correspond à un client existant
  const isNewEntry = query.trim() !== "" && !options.some((o) => o.name.toLowerCase() === query.toLowerCase());

  const encoded = (o: SelectOption | null) =>
    !o ? "" : encodeType ? `${o.type ?? "client"}:${o.id}` : o.id;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!typing || q === "") return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [query, options, typing]);

  function choose(o: SelectOption) {
    setSelected(o);
    setQuery(o.name);
    setTyping(false);
    setOpen(false);
    onChangeCallback?.(o);
  }

  // Regroupe les options filtrées par `group`.
  const groups = useMemo(() => {
    const map = new Map<string, SelectOption[]>();
    for (const o of filtered) {
      const g = o.group ?? "";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    }
    return [...map.entries()];
  }, [filtered]);

  function clearField() {
    setQuery("");
    setSelected(null);
    setTyping(false);
    onChangeCallback?.(null);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected ? encoded(selected) : query} />
      <div className="relative">
        <input
          type="text"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            setTyping(true);
            setOpen(true);
            if (selected) {
              setSelected(null);
            }
            // Appelle onChangeCallback avec un objet temporaire pour le texte libre
            if (newValue.trim()) {
              onChangeCallback?.({ id: "", name: newValue, type: "client" });
            } else {
              onChangeCallback?.(null);
            }
          }}
          onFocus={() => {
            setOpen(true);
            setTyping(false);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white pr-9"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isNewEntry && (
            <span className="text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5 font-semibold">
              Nouveau
            </span>
          )}
          {query && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                clearField();
              }}
              className="text-muted hover:text-foreground"
              title="Vider"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-white shadow-lg py-1">
          {filtered.length === 0 && !isNewEntry ? (
            <li className="px-3 py-2 text-sm text-muted">Aucun résultat</li>
          ) : (
            <>
              {groups.map(([g, opts]) => (
                <li key={g || "_"}>
                  {g && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {g}
                    </p>
                  )}
                  {opts.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        choose(o);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-background ${
                        o.id === selected?.id ? "text-primary font-medium" : ""
                      }`}
                    >
                      <span>{o.name}</span>
                    </button>
                  ))}
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
