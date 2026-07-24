import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-bold">
            ₣
          </div>
          <h1 className="text-xl font-bold">Agence Transfert</h1>
          <p className="text-sm text-muted mt-1">Grand livre digital</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Pas encore de compte?{" "}
          <a href="/signup" className="text-primary hover:underline font-medium">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}
