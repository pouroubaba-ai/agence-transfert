import Link from "next/link";
import { formatFCFA } from "@/lib/format";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "primary";
}) {
  const toneClass =
    tone === "negative"
      ? "text-danger"
      : tone === "positive"
        ? "text-primary"
        : tone === "primary"
          ? "text-primary"
          : "text-foreground";
  return (
    <div className="card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

/** Affiche un solde avec la bonne couleur et le bon libellé selon le signe. */
export function BalanceTag({
  amount,
  positiveLabel,
  negativeLabel,
}: {
  amount: number;
  positiveLabel: string; // libellé quand amount > 0
  negativeLabel: string; // libellé quand amount < 0
}) {
  if (Math.abs(amount) < 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-background px-2.5 py-1 text-xs font-medium text-muted">
        Soldé
      </span>
    );
  }
  const positive = amount > 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        positive ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
      }`}
    >
      {formatFCFA(Math.abs(amount))}
      <span className="font-normal opacity-80">
        · {positive ? positiveLabel : negativeLabel}
      </span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    EN_ATTENTE: { label: "En attente", cls: "bg-warning/10 text-warning" },
    EXECUTE: { label: "Exécuté", cls: "bg-primary/10 text-primary" },
    ANNULE: { label: "Annulé", cls: "bg-danger/10 text-danger" },
  };
  const s = map[status] ?? { label: status, cls: "bg-background text-muted" };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card p-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="text-sm text-muted mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
    >
      {children}
    </Link>
  );
}
