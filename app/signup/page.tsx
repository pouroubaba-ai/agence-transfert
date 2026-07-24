import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SignupForm from "./signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold">
            ₣
          </div>
          <h1 className="text-xl font-bold">Créer un compte</h1>
          <p className="text-sm text-muted mt-1">Gérer votre agence de transfert</p>
        </div>
        <div className="card p-6">
          <SignupForm />
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Vous avez un compte?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
