import { requireUser } from "@/lib/auth";
import Sidebar from "@/components/sidebar";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} name={user.name} agency={user.agency.name} />
      <main className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
