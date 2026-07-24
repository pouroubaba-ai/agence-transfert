"use client";

import { useState } from "react";
import type { ReportData } from "@/lib/queries";

/**
 * Bouton « Rapport » : demande confirmation dans une modale avant de générer
 * le PDF, pour éviter les rapports lancés par erreur.
 */
export default function ReportButton({ data }: { data: ReportData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      // Chargé à la demande : jsPDF n'alourdit pas le tableau de bord.
      const { buildReport } = await import("@/lib/report-pdf");
      buildReport({ ...data, generatedAt: new Date(data.generatedAt) });
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
      >
        Rapport
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Générer le rapport ?</h2>
            <p className="text-sm text-muted mt-2">
              Un rapport PDF de la situation générale va être créé : indicateurs
              et clients débiteurs.
            </p>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={generate}
                className="btn-primary flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? "Génération…" : "Générer le rapport"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
