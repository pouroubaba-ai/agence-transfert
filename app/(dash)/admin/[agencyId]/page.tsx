import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientBalance, allocatedAmount } from "@/lib/ledger";
import { formatFCFA, formatDateShort } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function AdminAgencyPage({
  params,
}: {
  params: Promise<{ agencyId: string }>;
}) {
  await requireSuperadmin();
  const { agencyId } = await params;

  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    include: {
      clients: { include: { transfers: true, payments: true }, orderBy: { name: "asc" } },
      transfers: {
        include: { client: true, channel: true, allocations: true },
        orderBy: { createdAt: "desc" },
      },
      payments: { include: { client: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!agency) notFound();

  const th = "px-4 py-2.5 font-medium text-left text-muted";
  const td = "px-4 py-2.5 whitespace-nowrap";

  return (
    <div>
      <Link
        href="/admin"
        className="text-sm text-muted hover:text-primary mb-4 inline-block"
      >
        ← Admin global
      </Link>
      <PageHeader
        title={agency.name}
        subtitle={`${agency.clients.length} client(s) · ${agency.transfers.length} transfert(s)`}
      />

      {/* Transferts */}
      <div className="card overflow-hidden mb-6">
        <h2 className="font-semibold px-4 py-3 border-b border-border">
          Transferts ({agency.transfers.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Date</th>
                <th className={th}>Client</th>
                <th className={th}>Canal</th>
                <th className={th + " text-right"}>Montant</th>
                <th className={th + " text-right"}>Frais</th>
                <th className={th + " text-right"}>Retrait</th>
                <th className={th + " text-right"}>Payé</th>
                <th className={th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {agency.transfers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={8}>
                    Aucun transfert.
                  </td>
                </tr>
              ) : (
                agency.transfers.map((t) => {
                  const paid = allocatedAmount(t.allocations);
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className={td + " text-muted"}>
                        {formatDateShort(t.createdAt)}
                      </td>
                      <td className={td}>{t.client?.name ?? "—"}</td>
                      <td className={td + " text-muted"}>{t.channel.name}</td>
                      <td className={td + " text-right"}>{formatFCFA(t.amount)}</td>
                      <td className={td + " text-right text-muted"}>
                        {formatFCFA(t.fee)}
                      </td>
                      <td className={td + " text-right text-muted"}>
                        {t.withdrawalFee > 0 ? formatFCFA(t.withdrawalFee) : "—"}
                      </td>
                      <td className={td + " text-right text-primary"}>
                        {formatFCFA(paid)}
                      </td>
                      <td className={td}>
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients */}
      <div className="card overflow-hidden mb-6">
        <h2 className="font-semibold px-4 py-3 border-b border-border">
          Clients ({agency.clients.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Nom</th>
                <th className={th + " text-right"}>Solde (doit)</th>
              </tr>
            </thead>
            <tbody>
              {agency.clients.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={2}>
                    Aucun client.
                  </td>
                </tr>
              ) : (
                agency.clients.map((c) => {
                  const bal = clientBalance(c.transfers, c.payments);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0">
                      <td className={td}>{c.name}</td>
                      <td className={td + " text-right"}>
                        {bal > 0.5 ? (
                          <span className="text-danger font-medium">
                            {formatFCFA(bal)}
                          </span>
                        ) : (
                          <span className="text-primary">Soldé</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Versements */}
      <div className="card overflow-hidden">
        <h2 className="font-semibold px-4 py-3 border-b border-border">
          Versements ({agency.payments.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Date</th>
                <th className={th}>Client</th>
                <th className={th}>Méthode</th>
                <th className={th + " text-right"}>Montant</th>
                <th className={th}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {agency.payments.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted" colSpan={5}>
                    Aucun versement.
                  </td>
                </tr>
              ) : (
                agency.payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className={td + " text-muted"}>
                      {formatDateShort(p.createdAt)}
                    </td>
                    <td className={td}>{p.client?.name ?? "—"}</td>
                    <td className={td + " text-muted"}>{p.method ?? "—"}</td>
                    <td className={td + " text-right text-primary"}>
                      {formatFCFA(p.amount)}
                    </td>
                    <td className={td}>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
