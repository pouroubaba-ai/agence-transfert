"use client";

import { useState } from "react";
import { formatFCFA } from "@/lib/format";
import { StatusBadge } from "@/components/ui";
import DateFilter, { inRange, type DateRange } from "@/components/date-filter";
import CancelTransferButton from "@/components/cancel-transfer-button";

export type FilePayment = {
  id: string;
  date: string;
  dateISO: string;
  amount: number;
  method: string | null;
  status: string;
};

export type FileTransfer = {
  id: string;
  date: string;
  dateISO: string;
  amount: number;
  fee: number;
  withdrawalFee: number;
  total: number;
  paid: number;
  remaining: number;
  status: string;
  channelName: string;
  payments: FilePayment[];
};

export default function ClientFile({
  totals,
  transfers,
  payments,
}: {
  totals: {
    transferred: number;
    commissions: number;
    paid: number;
    remaining: number;
  };
  transfers: FileTransfer[];
  payments: FilePayment[];
}) {
  const [tab, setTab] = useState<"transferts" | "versements">("transferts");
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [openId, setOpenId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const hasAnnulledTransfers = transfers.some((t) => t.status === "ANNULE");
  const hasAnnulledPayments = payments.some((p) => p.status === "ANNULE");

  const shownTransfers = transfers
    .filter((t) => inRange(t.dateISO, range))
    .filter((t) => showCancelled || t.status !== "ANNULE");
  const shownPayments = payments
    .filter((p) => inRange(p.dateISO, range))
    .filter((p) => showCancelled || p.status !== "ANNULE");

  const card = (label: string, value: string, tone = "") => (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-lg font-bold mt-1 ${tone}`}>{value}</p>
    </div>
  );

  const tabBtn = (key: "transferts" | "versements", label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`rounded-md px-4 py-1.5 text-sm font-medium ${
        tab === key
          ? "bg-primary text-white"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Indicateurs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {card("Total transféré", formatFCFA(totals.transferred))}
        {card(
          "Commissions gagnées",
          formatFCFA(totals.commissions),
          "text-primary",
        )}
        {card("Versé", formatFCFA(totals.paid), "text-primary")}
        {card(
          "Reste à verser",
          totals.remaining > 0.5 ? formatFCFA(totals.remaining) : "Soldé",
          totals.remaining > 0.5 ? "text-danger" : "text-primary",
        )}
      </div>

      {/* Toggle + filtre date */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-border bg-card p-1">
            {tabBtn("transferts", `Transferts (${transfers.length})`)}
            {tabBtn("versements", `Versements (${payments.length})`)}
          </div>
          <DateFilter onChange={setRange} />
        </div>
        {(hasAnnulledTransfers || hasAnnulledPayments) && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCancelled}
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="rounded"
            />
            <span className="text-muted">Afficher les éléments annulés</span>
          </label>
        )}
      </div>

      {tab === "transferts" ? (
        <div className="card overflow-hidden">
          {shownTransfers.length === 0 ? (
            <p className="text-sm text-muted px-5 py-6">
              Aucun transfert sur cette période.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {shownTransfers.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === t.id ? null : t.id)}
                    className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left hover:bg-background"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-muted">
                        {t.date} · {t.channelName}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-bold">{formatFCFA(t.amount)}</p>
                      <p className="text-[11px] text-muted">
                        frais {formatFCFA(t.fee)}
                      </p>
                      {t.withdrawalFee > 0 && (
                        <p className="text-[11px] text-muted">
                          retrait {formatFCFA(t.withdrawalFee)}
                        </p>
                      )}
                      <p className="text-[11px] text-primary font-medium mt-1">
                        Versé {formatFCFA(t.paid)}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center gap-2 px-5 py-2 border-t border-border">
                    <StatusBadge status={t.status} />
                    {t.remaining < 1 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Payé
                      </span>
                    ) : (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                        Reste {formatFCFA(t.remaining)}
                      </span>
                    )}
                  </div>

                  {openId === t.id && (
                    <div className="bg-background/50 px-5 py-3 space-y-3 border-t border-border">
                      {t.payments.length > 0 && (
                        <div className="space-y-1 text-xs pt-2 border-t border-border">
                          {t.payments.map((p) => (
                            <li
                              key={p.id}
                              className="flex justify-between"
                            >
                              <span className="text-muted">
                                {p.date}
                                {p.method ? ` · ${p.method}` : ""}
                              </span>
                              <span className="font-medium text-primary">
                                + {formatFCFA(p.amount)}
                              </span>
                            </li>
                          ))}
                        </div>
                      )}
                      {t.status !== "ANNULE" && (
                        <div className="pt-2">
                          <CancelTransferButton transferId={t.id} status={t.status} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {shownPayments.length === 0 ? (
            <p className="text-sm text-muted px-5 py-6">
              Aucun versement sur cette période.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {shownPayments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">
                      + {formatFCFA(p.amount)}
                    </p>
                    <p className="text-xs text-muted">
                      {p.date}
                      {p.method ? ` · ${p.method}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
