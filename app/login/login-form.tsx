"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
      >
        {pending ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
