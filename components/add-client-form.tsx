"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions";
import Modal from "@/components/modal";

export default function AddClientForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createClient, null);
  const router = useRouter();
  const result = state as { ok?: boolean; error?: string } | null;

  // Enregistré : on referme la modale et on rafraîchit la liste derrière.
  useEffect(() => {
    if (result?.ok) {
      setOpen(false);
      router.refresh();
    }
  }, [result, router]);

  const inputCls = "w-full rounded-lg border border-border px-3 py-2 text-sm";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary mb-6 rounded-lg px-4 py-2.5 text-sm font-semibold"
      >
        + Ajouter un client
      </button>

      {open && (
        <Modal title="Nouveau client" onClose={() => setOpen(false)}>
          <form action={action} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Nom complet *</label>
              <input name="name" required autoFocus className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Téléphone</label>
              <input name="phone" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Note (optionnel)
              </label>
              <input name="note" className={inputCls} />
            </div>

            {result?.error && (
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                {result.error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted"
              >
                Annuler
              </button>
              <button
                disabled={pending}
                className="btn-primary flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {pending ? "..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
