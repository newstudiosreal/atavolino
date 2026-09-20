"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ConfermaResetPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Imposta una nuova password</h1>

      <Panel className="mt-8 w-full">
        {done ? (
          <p className="text-card-green">Password aggiornata! Ora puoi accedere.</p>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (password.length < 8) {
                setError("La password deve avere almeno 8 caratteri.");
                return;
              }
              setError(null);
              startTransition(async () => {
                const supabase = createClient();
                const { error: updateError } = await supabase.auth.updateUser({ password });
                if (updateError) {
                  setError("Impossibile aggiornare la password. Il link potrebbe essere scaduto.");
                  return;
                }
                setDone(true);
                setTimeout(() => router.push("/login"), 1500);
              });
            }}
          >
            <Input
              label="Nuova password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm text-card-red">{error}</p>}
            <Button type="submit" loading={pending}>
              Aggiorna password
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}
