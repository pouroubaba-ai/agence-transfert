/**
 * Crée (ou promeut) un compte super-administrateur : accès à la vue globale
 * /admin sur toutes les agences.
 *
 *   npx tsx prisma/create-superadmin.ts <email> <motDePasse>
 *
 * - Si l'email existe déjà, le compte est promu SUPERADMIN (mot de passe mis à jour).
 * - Sinon, une agence « Administration » et le compte SUPERADMIN sont créés.
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  const password = process.argv[3] ?? "";

  if (!email || !password) {
    console.error("Usage : npx tsx prisma/create-superadmin.ts <email> <motDePasse>");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Le mot de passe doit faire au moins 8 caractères.");
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "SUPERADMIN", password: hashed, active: true },
    });
    console.log(`Compte « ${email} » promu SUPERADMIN (mot de passe mis à jour).`);
    return;
  }

  // Agence dédiée à l'administration (réutilisée si déjà présente).
  let admin = await prisma.agency.findFirst({ where: { name: "Administration" } });
  if (!admin) {
    admin = await prisma.agency.create({ data: { name: "Administration" } });
  }

  await prisma.user.create({
    data: {
      agencyId: admin.id,
      name: "Super Admin",
      email,
      password: hashed,
      role: "SUPERADMIN",
    },
  });
  console.log(`Compte SUPERADMIN « ${email} » créé.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
