import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { AuthForm } from "@/components/layout/AuthForm";
import { loginAction } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Accedi</h1>
      <p className="mt-2 text-slate-300">Bentornato al tavolo.</p>

      <Panel className="mt-8 w-full">
        <AuthForm
          fields={[
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password", type: "password", autoComplete: "current-password" }
          ]}
          submitLabel="Accedi"
          action={loginAction}
          onSuccessRedirect="/lobby"
        />
      </Panel>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-slate-300">
        <Link href="/recupero-password" className="hover:text-brand-yellow">
          Hai dimenticato la password?
        </Link>
        <p>
          Non hai un account?{" "}
          <Link href="/register" className="text-brand-yellow hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
