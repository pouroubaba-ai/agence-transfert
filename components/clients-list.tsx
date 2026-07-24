"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BalanceTag, EmptyState } from "@/components/ui";
import SearchBox from "@/components/search-box";

type Row = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  transferCount: number;
};

export default function ClientsList({ clients }: { clients: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "debt">("all");
  const router = useRouter();

  const rows = clients
    .filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
    .filter((c) => (filter === "debt" ? c.balance > 0.5 : true));

  const chip = (key: "all" | "debt", label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
        filter === key ? "bg-primary text-white" : "border border-border text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1 min-w-48">
          <SearchBox
            value={q}
            onChange={setQ}
            suggestions={clients.map((c) => c.name).sort()}
            placeholder="Rechercher un client…"
          />
        </div>
        {chip("all", "Tous")}
        {chip("debt", "À relancer")}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Aucun client" hint="Aucun résultat pour ce filtre." />
      ) : (
        <>
          {/* Téléphone : une carte par client. */}
          <ul className="space-y-3 sm:hidden">
            {rows.map((c) => (
              <li
                key={c.id}
                onClick={() => router.push(`/clients/${c.id}`)}
                className="card cursor-pointer p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {c.phone ?? "Sans téléphone"} · {c.transferCount} transfert(s)
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <BalanceTag amount={c.balance} positiveLabel="doit" negativeLabel="avance" />
                </div>
              </li>
            ))}
          </ul>

          <div className="card hidden overflow-hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Téléphone</th>
                  <th className="px-5 py-3 font-medium text-center">Transferts</th>
                  <th className="px-5 py-3 font-medium text-right">Solde</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/clients/${c.id}`)}
                    className="border-b border-border last:border-0 hover:bg-background cursor-pointer"
                  >
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-muted">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-center text-muted">{c.transferCount}</td>
                    <td className="px-5 py-3 text-right">
                      <BalanceTag amount={c.balance} positiveLabel="doit" negativeLabel="avance" />
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
