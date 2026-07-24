"use client";

import { useEffect } from "react";

// Enregistre le service worker côté client, une fois la page chargée.
// Nécessaire pour que Chrome propose « Installer l'application ».
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Enregistrement silencieux : pas bloquant si ça échoue.
        });
    }
  }, []);

  return null;
}
