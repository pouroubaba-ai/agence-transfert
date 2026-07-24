/**
 * Nettoyage ponctuel : annule les versements « orphelins » — ceux qui ne
 * financent plus aucun transfert actif (transferts annulés avant le correctif
 * de cancelTransfer). Sans ce nettoyage, ils comptent comme une fausse avance.
 *
 *   npx tsx prisma/fix-orphan-payments.ts          → aperçu (ne modifie rien)
 *   npx tsx prisma/fix-orphan-payments.ts --apply  → applique les annulations
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const apply = process.argv.includes("--apply");

  const payments = await prisma.payment.findMany({
    where: { direction: "ENTREE", status: "ENREGISTRE" },
    include: {
      client: true,
      transfer: true,
      allocations: { include: { transfer: true } },
    },
  });

  const orphans = payments.filter((p) => {
    const financeActif =
      (p.transfer && p.transfer.status !== "ANNULE") ||
      p.allocations.some((a) => a.transfer && a.transfer.status !== "ANNULE");
    // Orphelin = rattaché à au moins un transfert (direct ou imputation),
    // mais aucun n'est actif.
    const estRattache = !!p.transfer || p.allocations.length > 0;
    return estRattache && !financeActif;
  });

  if (orphans.length === 0) {
    console.log("Aucun versement orphelin. Rien à faire.");
    return;
  }

  console.log(`${orphans.length} versement(s) orphelin(s) trouvé(s) :`);
  for (const p of orphans) {
    console.log(
      `  - ${p.client?.name ?? "?"} : ${Math.round(p.amount)} FCFA ` +
        `(${p.createdAt.toISOString().slice(0, 10)})`
    );
  }

  if (!apply) {
    console.log("\nAperçu uniquement. Relance avec --apply pour annuler ces versements.");
    return;
  }

  for (const p of orphans) {
    await prisma.payment.update({
      where: { id: p.id },
      data: { status: "ANNULE" },
    });
  }
  console.log(`\n${orphans.length} versement(s) annulé(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
