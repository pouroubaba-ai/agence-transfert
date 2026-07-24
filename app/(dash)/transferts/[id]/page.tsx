import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTransferStatus } from "@/lib/actions";
import { allocatedAmount } from "@/lib/ledger";
import { formatFCFA, formatDate } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui";
import TrancheForm from "@/components/tranche-form";
import CancelTransferButton from "@/components/cancel-transfer-button";

export default async function TransferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const t = await prisma.transfer.findFirst({
    where: { id, agencyId: user.agencyId },
    include: {
      client: true,
      channel: true,
      createdBy: true,
      allocations: {
        include: { payment: true },
        orderBy: { id: "desc" },
      },
    },
  });
  if (!t) notFound();

  const paid = allocatedAmount(t.allocations);
  const remaining = t.total - paid;
  const pct = t.total > 0 ? Math.min(100, (paid / t.total) * 100) : 0;

  // La partie (débiteur) est un client.
  const partyName = t.client?.name ?? "—";
  const partyHref = `/clients/${t.clientId}`;

  const infoCls =
    "flex flex-wrap justify-between gap-x-3 gap-y-1 py-2 border-b border-border last:border-0";

  return (
    <div>
      <Link
        href="/transferts"
        className="text-sm text-muted hover:text-primary mb-4 inline-block"
      >
        ← Transferts
      </Link>
      <PageHeader
        title={`Transfert · ${formatFCFA(t.amount)}`}
        subtitle={`Pour ${partyName} · ${formatDate(t.createdAt)}`}
        action={<StatusBadge status={t.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Détails */}
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Détails</h2>
            <div className="text-sm">
              <div className={infoCls}>
                <span className="text-muted">Client</span>
                <Link href={partyHref} className="font-medium hover:text-primary">
                  {partyName}
                </Link>
              </div>
              <div className={infoCls}>
                <span className="text-muted">Canal</span>
                <span className="font-medium">{t.channel.name}</span>
              </div>
              <div className={infoCls}>
                <span className="text-muted">Montant</span>
                <span className="font-medium">{formatFCFA(t.amount)}</span>
              </div>
              <div className={infoCls}>
                <span className="text-muted">
                  Frais{" "}
                  {t.feeManual
                    ? "(manuel)"
                    : t.feeBase && t.feePerBase
                      ? `(${new Intl.NumberFormat("fr-FR").format(
                          t.feePerBase
                        )} / ${new Intl.NumberFormat("fr-FR").format(t.feeBase)})`
                      : ""}
                </span>
                <span className="font-medium">{formatFCFA(t.fee)}</span>
              </div>
              <div className={infoCls}>
                <span className="text-muted">Total dû par le client</span>
                <span className="font-bold text-primary">
                  {formatFCFA(t.total)}
                </span>
              </div>
              {t.beneficiaryName && (
                <div className={infoCls}>
                  <span className="text-muted">Bénéficiaire</span>
                  <span className="font-medium">
                    {t.beneficiaryName}
                    {t.beneficiaryCountry ? ` (${t.beneficiaryCountry})` : ""}
                  </span>
                </div>
              )}
              {t.createdBy && (
                <div className={infoCls}>
                  <span className="text-muted">Enregistré par</span>
                  <span className="font-medium">{t.createdBy.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Versements */}
          <div className="card overflow-hidden">
            <h2 className="font-semibold px-5 py-4 border-b border-border">
              Versements ({t.allocations.length})
            </h2>
            {t.allocations.length === 0 ? (
              <p className="text-sm text-muted px-5 py-6">
                Aucune tranche payée pour l'instant.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {t.allocations.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-primary">
                        + {formatFCFA(a.amount)}
                      </p>
                      <p className="text-xs text-muted">
                        {formatDate(a.payment.createdAt)}
                        {a.payment.method ? ` · ${a.payment.method}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Colonne : progression + actions */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold mb-3">Paiement</h2>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted">Payé</span>
              <span className="font-medium">{formatFCFA(paid)}</span>
            </div>
            <div className="h-2 rounded-full bg-background overflow-hidden mb-2">
              <div
                className="h-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Reste dû</span>
              <span
                className={`font-bold ${remaining < 1 ? "text-primary" : "text-danger"}`}
              >
                {remaining < 1 ? "Soldé ✓" : formatFCFA(remaining)}
              </span>
            </div>

            {remaining >= 1 && (
              <TrancheForm
                transferId={t.id}
                clientId={t.clientId}
                remaining={remaining}
              />
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-3">Statut</h2>
            {t.status === "ANNULE" ? (
              <CancelTransferButton transferId={t.id} status={t.status} />
            ) : (
              <div className="space-y-3">
                <form action={updateTransferStatus} className="space-y-3">
                  <input type="hidden" name="id" value={t.id} />
                  <select
                    name="status"
                    defaultValue={t.status}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
                  >
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EXECUTE">Exécuté</option>
                  </select>
                  <button className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background">
                    Mettre à jour le statut
                  </button>
                </form>
                <CancelTransferButton transferId={t.id} status={t.status} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
