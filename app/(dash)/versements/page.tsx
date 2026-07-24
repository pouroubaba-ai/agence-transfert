import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateShort, formatFCFA } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import HistoryTabs from "@/components/history-tabs";
import PaymentsList from "@/components/payments-list";

export default async function PaymentsPage() {
  const user = await requireUser();
  const payments = await prisma.payment.findMany({
    where: { agencyId: user.agencyId },
    include: {
      client: true,
      allocations: { include: { transfer: { include: { channel: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = payments.map((p) => ({
    id: p.id,
    date: formatDate(p.createdAt),
    iso: p.createdAt.toISOString(),
    isIn: p.direction === "ENTREE",
    partyName: p.client?.name ?? "—",
    partyHref: p.clientId ? `/clients/${p.clientId}` : null,
    method: p.method,
    amount: p.amount,
    status: p.status,
    allocations: p.allocations.map((a) => ({
      id: a.id,
      label: `Transfert ${formatFCFA(a.transfer.total)} du ${formatDateShort(
        a.transfer.createdAt
      )}`,
      amount: a.amount,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Historique"
        subtitle="Journal de tous les encaissements"
      />
      <HistoryTabs active="versements" />
      <PaymentsList rows={rows} />
    </div>
  );
}
