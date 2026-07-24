import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getDashboardData, getReportData, type Range } from "@/lib/queries";
import { formatFCFA } from "@/lib/format";
import { PageHeader, StatCard } from "@/components/ui";
import DonutChart from "@/components/donut-chart";
import ReportButton from "@/components/report-button";
import PeriodFilter from "@/components/period-filter";

/** Traduit les paramètres d'URL en plage de dates. */
function toRange(p?: string, from?: string, to?: string): Range {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  switch (p) {
    case "today":
      return { from: startOfDay(now), to: null };
    case "week": {
      const d = startOfDay(now);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lundi
      return { from: d, to: null };
    }
    case "month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    case "year":
      return { from: new Date(now.getFullYear(), 0, 1), to: null };
    case "custom":
      return {
        from: from ? startOfDay(new Date(from)) : null,
        to: to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : null,
      };
    default:
      return { from: null, to: null };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; from?: string; to?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const range = toRange(sp.p, sp.from, sp.to);

  const [d, report] = await Promise.all([
    getDashboardData(user.agencyId, range),
    getReportData(user.agencyId),
  ]);

  return (
    <div>
      <PageHeader
        title={`Bonjour, ${user.name.split(" ")[0]}`}
        subtitle="Vue d'ensemble des soldes et de l'activité"
        action={<ReportButton data={report} />}
      />

      <Suspense fallback={null}>
        <PeriodFilter />
      </Suspense>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          label="Transferts"
          value={formatFCFA(d.transferVolume)}
          hint={`Commission : ${formatFCFA(d.commissionEarned)} · ${d.transferCount} transfert(s)`}
        />
        <StatCard
          label="Clients qui me doivent"
          value={formatFCFA(d.owedToMe)}
          hint={`Encaissements à réaliser`}
          tone="negative"
        />
      </div>

      {/* Répartition des dettes */}
      <div className="card p-5">
        <h2 className="font-semibold mb-1">Clients débiteurs</h2>
        <p className="text-xs text-muted mb-4">
          Ce que les clients doivent — clique une légende pour le détail
        </p>
        <DonutChart data={d.debtSplit} centerLabel="total dû" />
      </div>
    </div>
  );
}
