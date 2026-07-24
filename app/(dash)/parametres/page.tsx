import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import OrangePasswordForm from "@/components/orange-password-form";

export default async function SettingsPage() {
  const user = await requireUser();

  const settings = await prisma.agencySettings.findUnique({
    where: { agencyId: user.agencyId },
  });

  const defaultSettings = {
    ussdPrefix: settings?.ussdPrefix ?? "#145#1",
    ussdPassword: settings?.ussdPassword ?? "",
    ussdSuffix: settings?.ussdSuffix ?? "#",
    settingsPin: settings?.settingsPin ?? "1234",
  };

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration Orange Money USSD"
      />

      <div className="max-w-md">
        <div className="card p-6">
          <OrangePasswordForm defaultSettings={defaultSettings} />
        </div>
      </div>
    </div>
  );
}
