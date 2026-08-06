import Link from "next/link";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientBalance } from "@/lib/ledger";
import { formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/ui";

export default async function AdminPage() {
  await requireSuperadmin();

  // Vue globale : toutes les agences, sans filtre agencyId.
  const agencies = await prisma.agency.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      users: true,
      clients: true,
      transfers: true,
      payments: true,
    },
  });

  const rows = agencies.map((a) => {
    const activeTransfers = a.transfers.filter((t) => t.status !== "ANNULE");
    const volume = activeTransfers.reduce((s, t) => s + t.amount, 0);
    const commissions = activeTransfers.reduce((s, t) => s + t.fee, 0);
    const outstanding = clientBalance(a.transfers, a.payments);
    return {
      id: a.id,
      name: a.name,
      users: a.users.length,
      clients: a.clients.length,
      transfers: activeTransfers.length,
      volume,
      commissions,
      outstanding: Math.max(outstanding, 0),
    };
  });

  const totals = {
    agencies: rows.length,
    users: rows.reduce((s, r) => s + r.users, 0),
    clients: rows.reduce((s, r) => s + r.clients, 0),
    transfers: rows.reduce((s, r) => s + r.transfers, 0),
    volume: rows.reduce((s, r) => s + r.volume, 0),
    commissions: rows.reduce((s, r) => s + r.commissions, 0),
    outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
  };

  const card = (label: string, value: string, tone = "") => (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Admin global"
        subtitle="Vue sur toutes les agences de la base"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {card("Agences", String(totals.agencies))}
        {card("Comptes", String(totals.users))}
        {card("Clients", String(totals.clients))}
        {card("Transferts", String(totals.transfers))}
        {card("Volume transféré", formatFCFA(totals.volume))}
        {card("Commissions", formatFCFA(totals.commissions), "text-primary")}
        {card(
          "Encours dû (clients)",
          formatFCFA(totals.outstanding),
          totals.outstanding > 0.5 ? "text-danger" : "text-primary"
        )}
      </div>

      <div className="card overflow-hidden">
        <h2 className="font-semibold px-5 py-4 border-b border-border">
          Détail par agence{" "}
          <span className="font-normal text-xs text-muted">
            — clique sur une agence pour voir ses transferts
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="px-5 py-3 font-medium">Agence</th>
                <th className="px-5 py-3 font-medium text-right">Comptes</th>
                <th className="px-5 py-3 font-medium text-right">Clients</th>
                <th className="px-5 py-3 font-medium text-right">Transferts</th>
                <th className="px-5 py-3 font-medium text-right">Volume</th>
                <th className="px-5 py-3 font-medium text-right">Commissions</th>
                <th className="px-5 py-3 font-medium text-right">Encours dû</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0 hover:bg-background"
                >
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/${r.id}`} className="hover:text-primary">
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right text-muted">{r.users}</td>
                  <td className="px-5 py-3 text-right text-muted">{r.clients}</td>
                  <td className="px-5 py-3 text-right text-muted">{r.transfers}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {formatFCFA(r.volume)}
                  </td>
                  <td className="px-5 py-3 text-right text-primary whitespace-nowrap">
                    {formatFCFA(r.commissions)}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {r.outstanding > 0.5 ? (
                      <span className="text-danger font-medium">
                        {formatFCFA(r.outstanding)}
                      </span>
                    ) : (
                      <span className="text-primary">Soldé</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
