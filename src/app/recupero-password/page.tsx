import { Panel } from "@/components/ui/Panel";
import { AuthForm } from "@/components/layout/AuthForm";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export default function RecuperoPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Recupera password</h1>
      <p className="mt-2 text-center text-slate-300">
        Inserisci l&apos;email con cui ti sei registrato: ti invieremo un link per reimpostarla.
      </p>

      <Panel className="mt-8 w-full">
        <AuthForm
          fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
          submitLabel="Invia link di recupero"
          action={requestPasswordResetAction}
          successStaysOnPage
        />
      </Panel>
    </div>
  );
}
