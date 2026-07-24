"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelTransfer } from "@/lib/actions";

export default function CancelTransferButton({
  transferId,
  status,
}: {
  transferId: string;
  status: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (status === "ANNULE") {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold bg-warning/10 text-warning">
        Annulé
      </span>
    );
  }

  async function handleCancel() {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce transfert ?")) return;
    setPending(true);
    setError(null);
    const result = await cancelTransfer(transferId);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleCancel}
        disabled={pending}
        className="btn-danger w-full rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? "..." : "Annuler ce transfert"}
      </button>
      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
