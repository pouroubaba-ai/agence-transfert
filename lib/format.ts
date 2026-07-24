// Formatage FCFA et dates, en français.

export function formatFCFA(n: number): string {
  const rounded = Math.round(n);
  return new Intl.NumberFormat("fr-FR").format(rounded) + " FCFA";
}

// Affichage d'une saisie de montant : « 200000 » → « 200 000 »
// (les espaces sont retirés côté serveur avant conversion).
export function groupDigits(v: string): string {
  const d = v.replace(/\D/g, "");
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
