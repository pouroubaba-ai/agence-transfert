/**
 * Vide les données d'exploitation pour repartir de zéro.
 * On garde l'agence, les comptes (sinon plus de connexion possible) et les
 * canaux avec leurs frais. On supprime tout le reste.
 *
 *   npm run reset-data
 */
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  // L'ordre respecte les dépendances entre tables.
  const allocations = await prisma.paymentAllocation.deleteMany();
  const payments = await prisma.payment.deleteMany();
  const transfers = await prisma.transfer.deleteMany();
  const clients = await prisma.client.deleteMany();

  console.log("Supprimé :");
  console.log(`  imputations : ${allocations.count}`);
  console.log(`  versements  : ${payments.count}`);
  console.log(`  transferts  : ${transfers.count}`);
  console.log(`  clients     : ${clients.count}`);

  // Le formulaire de transfert a besoin d'un client par défaut.
  const agency = await prisma.agency.findFirst();
  if (agency) {
    await prisma.client.create({
      data: { agencyId: agency.id, name: "Client" },
    });
    console.log('Recréé : le client par défaut « Client »');
  }

  const channels = await prisma.channel.count();
  const users = await prisma.user.count();
  console.log(`Conservé : ${users} compte(s), ${channels} canal/canaux.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
