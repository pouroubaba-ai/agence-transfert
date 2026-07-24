import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleChannel } from "@/lib/actions";
import { channelClientFee } from "@/lib/ledger";
import { formatFCFA } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui";
import ChannelForm from "@/components/channel-form";
import DeleteChannelButton from "@/components/delete-channel-button";

function ruleLabel(rule: { base: number; feePerBase: number } | null) {
  if (!rule) return "—";
  return `${formatFCFA(rule.feePerBase)} / ${new Intl.NumberFormat("fr-FR").format(
    rule.base
  )}`;
}

export default async function ChannelsPage() {
  const user = await requireUser();
  const channels = await prisma.channel.findMany({
    where: { agencyId: user.agencyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Canaux de transfert"
        subtitle="Chaque canal porte ses propres frais"
      />

      <details className="card mb-6 group">
        <summary className="cursor-pointer list-none px-5 py-4 font-medium flex items-center justify-between">
          <span>+ Ajouter un canal</span>
          <span className="text-muted text-sm group-open:rotate-180 transition-transform">
            ▾
          </span>
        </summary>
        <div className="px-5 pb-5 border-t border-border pt-4">
          <ChannelForm />
        </div>
      </details>

      {channels.length === 0 ? (
        <EmptyState title="Aucun canal" hint="Ajoutez votre premier canal ci-dessus." />
      ) : (
        <div className="space-y-3">
          {channels.map((c) => {
            const clientRule = channelClientFee(c);
            return (
              <details key={c.id} className="card group">
                <summary className="cursor-pointer list-none px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-medium">{c.name}</span>
                    {!c.active && (
                      <span className="text-xs rounded-full bg-background px-2 py-0.5 text-muted">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted sm:text-sm">
                    <span>Frais : {ruleLabel(clientRule)}</span>
                    <span className="text-muted group-open:rotate-180 transition-transform">
                      ▾
                    </span>
                  </div>
                </summary>
                <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
                  <ChannelForm channel={c} />
                  <div className="space-y-2 pt-2 border-t border-border">
                    <form action={toggleChannel}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-sm text-muted hover:text-danger mt-3 block">
                        {c.active ? "Désactiver ce canal" : "Réactiver ce canal"}
                      </button>
                    </form>
                    {c.name.toLowerCase() !== "orange money" && (
                      <DeleteChannelButton channelId={c.id} />
                    )}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
