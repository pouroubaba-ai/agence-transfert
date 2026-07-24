import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData } from "./queries";

const BLUE: [number, number, number] = [37, 99, 235];
const GREY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [17, 24, 39];

/**
 * jsPDF encode en WinAnsi : tout caractère hors de cette table est remplacé
 * par un signe parasite (l'espace fine devenait « / », la flèche « ! »).
 * On normalise donc chaque texte avant de l'écrire.
 */
const clean = (s: string) =>
  s
    .replace(/[  -   　]/g, " ") // espaces exotiques
    .replace(/[←-⇿➔-➿]/g, ">") // fleches
    .replace(/[‐-―]/g, "-") // tirets longs
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/•/g, "-");

const money = (n: number) =>
  clean(new Intl.NumberFormat("fr-FR").format(Math.round(n))) + " FCFA";

const stamp = (d: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

/** Génère et télécharge le rapport de situation de l'agence. */
export function buildReport(data: ReportData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40; // marge
  let y = 0;

  // ---------- En-tête ----------
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 86, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text(clean(data.agencyName), M, 40);
  doc.setFont("helvetica", "normal").setFontSize(11);
  doc.text("Rapport de situation", M, 60);
  doc.setFontSize(9);
  doc.text(clean(`Généré le ${stamp(data.generatedAt)}`), W - M, 60, { align: "right" });
  y = 116;

  // ---------- Indicateurs ----------
  const i = data.indicators;
  const cards: [string, string, string][] = [
    [
      "Transferts",
      money(i.transferVolume),
      `Commission : ${money(i.commissionEarned)} · ${i.transferCount} transfert(s)`,
    ],
    [
      "Mes clients me doivent",
      money(i.owedToMe),
      `Total clients ${money(i.clientsOwe)}`,
    ],
  ];

  const cw = (W - M * 2 - 8) / 2;
  cards.forEach(([label, value, hint], idx) => {
    const x = M + idx * (cw + 8);
    doc.setDrawColor(229, 231, 235).setFillColor(249, 250, 251);
    doc.roundedRect(x, y, cw, 62, 6, 6, "FD");
    doc.setTextColor(...GREY).setFont("helvetica", "normal").setFontSize(8);
    doc.text(label, x + 10, y + 16);
    doc.setTextColor(...DARK).setFont("helvetica", "bold").setFontSize(12);
    doc.text(value, x + 10, y + 34);
    doc.setTextColor(...GREY).setFont("helvetica", "normal").setFontSize(7);
    doc.text(doc.splitTextToSize(hint, cw - 20), x + 10, y + 48);
  });
  y += 86;

  // ---------- Titre de section ----------
  const section = (title: string, subtitle?: string) => {
    if (y > doc.internal.pageSize.getHeight() - 140) {
      doc.addPage();
      y = 60;
    }
    doc.setTextColor(...DARK).setFont("helvetica", "bold").setFontSize(13);
    doc.text(title, M, y);
    if (subtitle) {
      doc.setTextColor(...GREY).setFont("helvetica", "normal").setFontSize(8.5);
      doc.text(subtitle, M, y + 13);
    }
    y += subtitle ? 28 : 16;
  };

  // ---------- Clients débiteurs ----------
  section("Clients débiteurs", "Clients dont le solde n'est pas soldé");

  if (data.clients.length === 0) {
    doc.setTextColor(...GREY).setFontSize(9);
    doc.text("Aucun client débiteur.", M, y);
    y += 24;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [
        ["Client", "Total pris", "Total payé", "Reste dû", "Dern. transfert", "Dern. versement"],
      ],
      body: data.clients.map((c) => [
        clean(c.name),
        money(c.taken),
        money(c.paid),
        money(c.remaining),
        clean(c.lastTransfer),
        clean(c.lastPayment),
      ]),
      foot: [
        [
          "Total",
          money(data.clients.reduce((s, c) => s + c.taken, 0)),
          money(data.clients.reduce((s, c) => s + c.paid, 0)),
          money(data.clients.reduce((s, c) => s + c.remaining, 0)),
          "",
          "",
        ],
      ],
      styles: { fontSize: 8.5, cellPadding: 5, textColor: DARK },
      headStyles: { fillColor: BLUE, textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [243, 244, 246], textColor: DARK, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 251] },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right", fontStyle: "bold" },
        4: { halign: "center" },
        5: { halign: "center" },
      },
    });
    // @ts-expect-error autoTable enrichit le document
    y = doc.lastAutoTable.finalY + 26;
  }

  // ---------- Pied de page ----------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(229, 231, 235);
    doc.line(M, doc.internal.pageSize.getHeight() - 34, W - M, doc.internal.pageSize.getHeight() - 34);
    doc.setTextColor(...GREY).setFont("helvetica", "normal").setFontSize(8);
    doc.text(
      clean(`${data.agencyName} - Rapport de situation`),
      M,
      doc.internal.pageSize.getHeight() - 20
    );
    doc.text(
      `Page ${p} / ${pages}`,
      W - M,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" }
    );
  }

  const d = data.generatedAt;
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
  doc.save(`rapport-${data.agencyName.toLowerCase().replace(/\s+/g, "-")}-${iso}.pdf`);
}
