"use client";

import { useActionState } from "react";
import { signup } from "@/lib/actions";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);
  const result = state as { ok?: boolean; error?: string } | null;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom de l'agence *</label>
        <input
          name="agencyName"
          type="text"
          required
          placeholder="Ex: Agence Express Mali"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Votre nom *</label>
        <input
          name="name"
          type="text"
          required
          placeholder="Ex: Jean Diallo"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <input
          name="email"
          type="email"
          required
          placeholder="Ex: jean@agence.com"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe *</label>
        <input
          name="password"
          type="password"
          required
          placeholder="Minimum 8 caractères"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
      </div>

      {result?.error && (
        <div className="rounded-lg bg-danger/10 text-danger px-3 py-2 text-sm">
          {result.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full btn-primary rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Création en cours..." : "Créer mon compte"}
      </button>
    </form>
  );
}
