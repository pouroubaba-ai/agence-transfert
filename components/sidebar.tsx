"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";

/**
 * Navigation : elle n'est plus affichée en permanence. Une barre du haut
 * contient l'icône burger, qui ouvre le menu en tiroir par-dessus la page.
 */
export default function Sidebar({
  role,
  name,
  agency,
}: {
  role: string;
  name: string;
  agency: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isExact = (href: string) => pathname === href;
  const inHistoryTransferts =
    pathname.startsWith("/transferts") && pathname !== "/transferts/nouveau";
  const inHistoryVersements =
    pathname.startsWith("/versements") && pathname !== "/versements/nouveau";
  const historyActive = inHistoryTransferts || inHistoryVersements;

  const [histOpen, setHistOpen] = useState(historyActive);

  // On referme le tiroir à chaque changement de page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Pas de défilement du fond quand le tiroir est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-background"
    }`;

  const item = (href: string, icon: string, label: string, active: boolean) => (
    <Link href={href} className={linkCls(active)}>
      <span className="w-5 text-center text-base leading-none">{icon}</span>
      {label}
    </Link>
  );

  return (
    <>
      {/* Barre du haut, toujours visible */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-lg"
        >
          ☰
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold tracking-tight text-white">
            LS
          </div>
          <p className="truncate text-sm font-semibold">{agency}</p>
        </div>
      </header>

      {/* Voile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Tiroir */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-white">
              LS
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{agency}</p>
              <p className="text-xs text-muted">Grand livre</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="h-8 w-8 shrink-0 rounded-lg text-muted hover:bg-background"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {item("/", "▦", "Tableau de bord", isExact("/"))}
          {item("/transferts/nouveau", "↗", "Transfert", isExact("/transferts/nouveau"))}
          {item("/versements/nouveau", "₣", "Versement", isExact("/versements/nouveau"))}

          {/* Accordéon Historique */}
          <div>
            <button
              type="button"
              onClick={() => setHistOpen((o) => !o)}
              className={linkCls(historyActive) + " w-full justify-between"}
            >
              <span className="flex items-center gap-3">
                <span className="w-5 text-center text-base leading-none">≡</span>
                Historique
              </span>
              <span className={`text-xs transition-transform ${histOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {histOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-border pl-2">
                <Link href="/transferts" className={linkCls(inHistoryTransferts)}>
                  Transferts
                </Link>
                <Link href="/versements" className={linkCls(inHistoryVersements)}>
                  Versements
                </Link>
              </div>
            )}
          </div>

          {item("/clients", "☺", "Clients", pathname.startsWith("/clients"))}

          {role === "SUPERADMIN" && (
            <>
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Administration
              </p>
              {item("/admin", "★", "Admin global", pathname.startsWith("/admin"))}
            </>
          )}

          <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Configuration
          </p>
          {item("/parametres", "⚙", "Paramètres", pathname.startsWith("/parametres"))}
          {item("/canaux", "≋", "Canaux & frais", pathname.startsWith("/canaux"))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="text-xs text-muted">
              {role === "SUPERADMIN"
                ? "Super Admin"
                : role === "OWNER"
                  ? "Patron"
                  : "Agent"}
            </p>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-background hover:text-danger"
          >
            ⎋ Déconnexion
          </button>
        </div>
      </aside>

      {/* Modal de confirmation déconnexion */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 space-y-4">
            <h2 className="font-semibold text-lg">Confirmer la déconnexion</h2>
            <p className="text-sm text-muted">
              Êtes-vous sûr de vouloir vous déconnecter?
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-background"
              >
                Annuler
              </button>
              <form action={logout}>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-danger text-white text-sm font-medium hover:bg-danger/90"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
