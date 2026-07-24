"use client";

import { useState } from "react";
import { deleteChannel } from "@/lib/actions";

export default function DeleteChannelButton({ channelId }: { channelId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce canal ?")) return;
    setPending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("id", channelId);
      await deleteChannel(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        className="text-sm text-danger hover:text-danger/80 disabled:opacity-50"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "..." : "Supprimer ce canal"}
      </button>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
