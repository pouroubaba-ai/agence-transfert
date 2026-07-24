import Link from "next/link";

/** Barre de navigation entre les historiques (Transferts | Versements). */
export default function HistoryTabs({
  active,
}: {
  active: "transferts" | "versements";
}) {
  const tabs = [
    { key: "transferts", label: "Transferts", href: "/transferts" },
    { key: "versements", label: "Versements", href: "/versements" },
  ] as const;

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-1 mb-6">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            active === t.key
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
