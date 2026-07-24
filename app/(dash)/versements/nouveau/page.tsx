import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getVersementParties } from "@/lib/queries";
import { PageHeader, EmptyState, LinkButton } from "@/components/ui";
import VersementForm from "@/components/versement-form";

export default async function NewVersementPage() {
  const user = await requireUser();
  const parties = await getVersementParties(user.agencyId);

  return (
    <div>
      <Link href="/versements" className="text-sm text-muted hover:text-primary mb-4 inline-block">
        ← Historique des versements
      </Link>
      <PageHeader
        title="Nouveau versement"
        subtitle="Encaisser d'un client"
      />

      {parties.length === 0 ? (
        <EmptyState
          title="Aucun client"
          hint="Ajoutez d'abord un client."
          action={<LinkButton href="/clients">+ Ajouter un client</LinkButton>}
        />
      ) : (
        <VersementForm parties={parties} />
      )}
    </div>
  );
}
