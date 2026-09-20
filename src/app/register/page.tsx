import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { AuthForm } from "@/components/layout/AuthForm";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Registrati</h1>
      <p className="mt-2 text-center text-slate-300">Crea il tuo profilo e siediti al tavolo.</p>

      <Panel className="mt-8 w-full">
        <AuthForm
          fields={[
            { name: "username", label: "Username", type: "text", autoComplete: "username" },
            { name: "email", label: "Email", type: "email", autoComplete: "email" },
            { name: "password", label: "Password (min. 8 caratteri)", type: "password", autoComplete: "new-password" }
          ]}
          submitLabel="Crea account"
          action={registerAction}
          successStaysOnPage
        />
      </Panel>

      <p className="mt-4 text-sm text-slate-300">
        Hai già un account?{" "}
        <Link href="/login" className="text-brand-yellow hover:underline">
          Accedi
        </Link>
      </p>
    </div>
  );
}
