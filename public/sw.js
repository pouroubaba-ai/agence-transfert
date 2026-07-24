// Service worker minimal : suffisant pour rendre l'app installable (PWA).
// Pas de mise en cache agressive — on laisse le réseau gérer chaque requête.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Un gestionnaire fetch est requis par Chrome pour proposer l'installation.
self.addEventListener("fetch", () => {
  // Passe-plat : ne modifie rien, laisse le navigateur récupérer la ressource.
});
