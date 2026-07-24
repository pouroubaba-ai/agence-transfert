import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { channelClientFee } from "@/lib/ledger";
import { PageHeader, EmptyState, LinkButton } from "@/components/ui";
import TransferForm from "./transfer-form";

export default async function NewTransferPage() {
  const user = await requireUser();

  const [clients, channels, settings] = await Promise.all([
    prisma.client.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { name: "asc" },
    }),
    prisma.channel.findMany({
      where: { agencyId: user.agencyId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.agencySettings.findUnique({
      where: { agencyId: user.agencyId },
    }),
  ]);

  return (
    <div>
      <Link
        href="/transferts"
        className="text-sm text-muted hover:text-primary mb-4 inline-block"
      >
        ← Transferts
      </Link>
      <PageHeader title="Nouveau transfert" />

      {clients.length === 0 || channels.length === 0 ? (
        <EmptyState
          title="Configuration requise"
          hint="Il faut au moins un client et un canal avant de créer un transfert."
          action={
            <div className="flex gap-3 justify-center">
              {clients.length === 0 && (
                <LinkButton href="/clients">+ Ajouter un client</LinkButton>
              )}
              {channels.length === 0 && (
                <LinkButton href="/canaux">+ Ajouter un canal</LinkButton>
              )}
            </div>
          }
        />
      ) : (
        <TransferForm
          defaultClientId={
            clients.find((c) => c.name.trim().toLowerCase() === "client")?.id ??
            clients[0]?.id ??
            ""
          }
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          channels={channels.map((c) => {
            const rule = channelClientFee(c);
            return {
              id: c.id,
              name: c.name,
              feeBase: rule?.base ?? null,
              feePerBase: rule?.feePerBase ?? null,
              withdrawalFeePercent: c.withdrawalFeePercent ?? null,
            };
          })}
          ussdPrefix={settings?.ussdPrefix ?? "#145#1"}
          ussdPassword={settings?.ussdPassword ?? ""}
          ussdSuffix={settings?.ussdSuffix ?? "#"}
        />
      )}
    </div>
  );
}
