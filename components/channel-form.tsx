"use client";

import { createChannel, updateChannel } from "@/lib/actions";

type Channel = {
  id: string;
  name: string;
  clientFeeBase: number | null;
  clientFeePerBase: number | null;
  withdrawalFeePercent: number | null;
};

const s = (n: number | null | undefined) => (n != null ? String(n) : "");

export default function ChannelForm({ channel }: { channel?: Channel }) {
  const editing = !!channel;

  const input =
    "w-full rounded-lg border border-border px-2.5 py-1.5 text-sm bg-white";

  return (
    <form
      action={editing ? updateChannel : createChannel}
      className="space-y-4"
    >
      {editing && <input type="hidden" name="id" value={channel!.id} />}

      <div>
        <label className="block text-sm font-medium mb-1">Nom du canal *</label>
        <input
          name="name"
          required
          defaultValue={channel?.name ?? ""}
          placeholder="Ex. Western Union, Wave, Banque…"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      {/* Frais */}
      <div>
        <p className="text-xs text-muted mb-1">Configuration des frais</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Pour chaque</label>
            <input
              name="feeBase"
              inputMode="numeric"
              defaultValue={s(channel?.clientFeeBase)}
              placeholder="100"
              className={input}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Frais prélevés</label>
            <input
              name="feePerBase"
              inputMode="numeric"
              defaultValue={s(channel?.clientFeePerBase)}
              placeholder="20"
              className={input}
            />
          </div>
        </div>
      </div>

      {/* Frais de retrait (optionnel) */}
      <div>
        <p className="text-xs text-muted mb-1">
          Frais de retrait (optionnel) — ajoutés au montant, jamais commissionnés
        </p>
        <div>
          <label className="block text-xs text-muted mb-1">Pourcentage (%)</label>
          <input
            name="withdrawalFeePercent"
            inputMode="decimal"
            defaultValue={s(channel?.withdrawalFeePercent)}
            placeholder="2"
            className={input}
          />
        </div>
      </div>

      <button className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
        {editing ? "Enregistrer les modifications" : "+ Ajouter le canal"}
      </button>
    </form>
  );
}
