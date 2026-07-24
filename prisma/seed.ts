import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import { computeFee, channelClientFee } from "../lib/ledger";

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Nettoyage...");
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.agency.deleteMany();

  console.log("Création de l'agence...");
  const agency = await prisma.agency.create({
    data: { name: "Agence Express Transfert" },
  });

  // Comptes internes
  const owner = await prisma.user.create({
    data: {
      agencyId: agency.id,
      name: "Patron (Ami)",
      email: "patron@agence.com",
      password: await bcrypt.hash("patron123", 10),
      role: "OWNER",
      canManageFees: true,
      canDelete: true,
    },
  });

  await prisma.user.create({
    data: {
      agencyId: agency.id,
      name: "Awa (Agent Mobile)",
      email: "awa@agence.com",
      password: await bcrypt.hash("agent123", 10),
      role: "AGENT",
      maxAmount: 500000,
      canManageFees: false,
      canDelete: false,
    },
  });

  // Canal : Orange Money
  const orange = await prisma.channel.create({
    data: {
      agencyId: agency.id,
      name: "Orange Money",
      generalFeeBase: 1000,
      generalFeePerBase: 20, // 20 pour 1000 (2 %)
      clientFeeBase: 1000,
      clientFeePerBase: 20,
    },
  });

  // Clients
  await prisma.client.create({
    data: { agencyId: agency.id, name: "Client", note: "Client par défaut (comptoir)" },
  });
  const kofi = await prisma.client.create({
    data: { agencyId: agency.id, name: "Kofi Mensah", phone: "07 00 00 00 01" },
  });
  const aisha = await prisma.client.create({
    data: { agencyId: agency.id, name: "Aïsha Diallo", phone: "07 00 00 00 02" },
  });

  console.log("Création des transferts et versements...");

  // Transfert 1 : Kofi envoie 200 000 via Orange Money. Payé partiellement.
  const rule1 = channelClientFee(orange)!;
  const amount1 = 200000;
  const fee1 = computeFee(amount1, rule1);
  const t1 = await prisma.transfer.create({
    data: {
      agencyId: agency.id,
      clientId: kofi.id,
      channelId: orange.id,
      amount: amount1,
      fee: fee1,
      total: amount1 + fee1,
      feeBase: rule1.base,
      feePerBase: rule1.feePerBase,
      beneficiaryName: "Frère de Kofi",
      beneficiaryCountry: "France",
      status: "EXECUTE",
      createdById: owner.id,
    },
  });

  // Versements sur transfert 1
  const p1 = await prisma.payment.create({
    data: {
      agencyId: agency.id,
      direction: "ENTREE",
      clientId: kofi.id,
      transferId: t1.id,
      amount: 150000,
      method: "espèces",
      createdById: owner.id,
    },
  });
  await prisma.paymentAllocation.create({
    data: { paymentId: p1.id, transferId: t1.id, amount: 150000 },
  });

  // Transfert 2 : Aïsha envoie 100 000. Payé entièrement.
  const rule2 = channelClientFee(orange)!;
  const amount2 = 100000;
  const fee2 = computeFee(amount2, rule2);
  const t2 = await prisma.transfer.create({
    data: {
      agencyId: agency.id,
      clientId: aisha.id,
      channelId: orange.id,
      amount: amount2,
      fee: fee2,
      total: amount2 + fee2,
      feeBase: rule2.base,
      feePerBase: rule2.feePerBase,
      beneficiaryName: "Fournisseur Aïsha",
      beneficiaryCountry: "Chine",
      status: "EXECUTE",
      createdById: owner.id,
    },
  });

  // Versement sur transfert 2
  const p2 = await prisma.payment.create({
    data: {
      agencyId: agency.id,
      direction: "ENTREE",
      clientId: aisha.id,
      transferId: t2.id,
      amount: amount2 + fee2,
      method: "mobile money",
      createdById: owner.id,
    },
  });
  await prisma.paymentAllocation.create({
    data: { paymentId: p2.id, transferId: t2.id, amount: amount2 + fee2 },
  });

  // Transfert 3 : Kofi envoie 300 000. Non payé.
  const rule3 = channelClientFee(orange)!;
  const amount3 = 300000;
  const fee3 = computeFee(amount3, rule3);
  await prisma.transfer.create({
    data: {
      agencyId: agency.id,
      clientId: kofi.id,
      channelId: orange.id,
      amount: amount3,
      fee: fee3,
      total: amount3 + fee3,
      feeBase: rule3.base,
      feePerBase: rule3.feePerBase,
      status: "EN_ATTENTE",
      createdById: owner.id,
    },
  });

  console.log("Terminé.");
  console.log("Connexion patron : patron@agence.com / patron123");
  console.log("Connexion agent  : awa@agence.com / agent123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
