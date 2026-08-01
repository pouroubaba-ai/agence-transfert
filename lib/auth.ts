import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const COOKIE = "session_user";

export async function getCurrentUser() {
  const store = await cookies();
  const userId = store.get(COOKIE)?.value;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { agency: true },
  });
  if (!user || !user.active) return null;
  return user;
}

/** À utiliser dans les pages protégées : redirige vers /login si non connecté. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Réservé au compte super-administrateur (vue globale sur toutes les agences).
 * Redirige un utilisateur normal vers l'accueil.
 */
export async function requireSuperadmin() {
  const user = await requireUser();
  if (user.role !== "SUPERADMIN") redirect("/");
  return user;
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE);
}
