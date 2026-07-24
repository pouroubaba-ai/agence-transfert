"use client";

import { useState } from "react";
import { updateUSSDConfig } from "@/lib/actions";

interface Settings {
  ussdPrefix: string;
  ussdPassword: string | null;
  ussdSuffix: string;
  settingsPin: string;
}

export default function OrangePasswordForm({
  defaultSettings,
}: {
  defaultSettings: Settings;
}) {
  const [showForm, setShowForm] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [ussdPassword, setUssdPassword] = useState(defaultSettings.ussdPassword || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleShowForm = () => {
    if (pinCode === defaultSettings.settingsPin) {
      setShowForm(true);
      setPinCode("");
    } else {
      setMessage("Code PIN incorrect");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append("ussdPassword", ussdPassword);

    await updateUSSDConfig(formData);

    setSaving(false);
    setMessage("✓ Mot de passe sauvegardé");
    setTimeout(() => {
      setMessage("");
      setShowForm(false);
    }, 2000);
  }

  if (!showForm) {
    return (
      <div className="space-y-4">
        <h2 className="font-semibold">Configuration Orange Money USSD</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Code PIN</label>
          <input
            type="password"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="Rentre le code PIN"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
          />
        </div>
        {message && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {message}
          </p>
        )}
        <button
          onClick={handleShowForm}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold w-full"
        >
          Accéder
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <h2 className="font-semibold">Mot de passe Orange Money</h2>

      <div className="bg-background rounded-lg p-4 space-y-2">
        <p className="text-xs text-muted font-medium uppercase mb-3">Code USSD</p>
        <div className="text-sm font-mono bg-white rounded-lg p-3 border border-border">
          {defaultSettings.ussdPrefix}*Montant*Numéro*<span className="text-primary font-semibold">{ussdPassword || "?"}</span>{defaultSettings.ussdSuffix}
        </div>
        <p className="text-xs text-muted mt-2">Seul le mot de passe est modifiable</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Mot de passe Orange Money *</label>
        <input
          type="text"
          inputMode="numeric"
          value={ussdPassword}
          onChange={(e) => setUssdPassword(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="Rentre ton mot de passe"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
        />
      </div>

      {message && (
        <p className="text-sm text-primary bg-primary/10 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-background"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? "..." : "Sauvegarder"}
        </button>
      </div>
    </form>
  );
}
