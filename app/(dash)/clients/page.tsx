import { requireUser } from "@/lib/auth";
import { getClientsWithBalance } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import ClientsList from "@/components/clients-list";
import AddClientForm from "@/components/add-client-form";

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await getClientsWithBalance(user.agencyId);

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Les personnes qui envoient de l'argent via l'agence"
      />

      <AddClientForm />

      <ClientsList
        clients={clients.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          balance: c.balance,
          transferCount: c.transferCount,
        }))}
      />
    </div>
  );
}
