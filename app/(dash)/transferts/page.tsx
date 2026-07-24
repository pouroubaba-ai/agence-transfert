import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateShort } from "@/lib/format";
import { allocatedAmount } from "@/lib/ledger";
import { PageHeader } from "@/components/ui";
import HistoryTabs from "@/components/history-tabs";
import TransfersList from "@/components/transfers-list";

export default async function TransfersPage() {
  const user = await requireUser();
  const transfers = await prisma.transfer.findMany({
    where: { agencyId: user.agencyId },
    include: {
      client: true,
      channel: true,
      allocations: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = transfers.map((t) => {
    const paid = allocatedAmount(t.allocations);
    return {
      id: t.id,
      date: formatDateShort(t.createdAt),
      iso: t.createdAt.toISOString(),
      partyName: t.client?.name ?? "—",
      channelName: t.channel.name,
      amount: t.amount,
      fee: t.fee,
      withdrawalFee: t.withdrawalFee,
      paid,
      remaining: t.total - paid,
      status: t.status,
    };
  });

  return (
    <div>
      <PageHeader
        title="Historique"
        subtitle="Toutes les demandes de transfert"
      />
      <HistoryTabs active="transferts" />
      <TransfersList rows={rows} />
    </div>
  );
}
