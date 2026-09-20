"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createGameAction } from "@/lib/actions/games";

export function CreateGameForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-4"
      action={(formData: FormData) => {
        setError(null);
        startTransition(async () => {
          const res = await createGameAction(formData);
          if (!res.ok || !res.code) {
            setError(res.message ?? "Impossibile creare il tavolo.");
            return;
          }
          router.push(`/lobby/tavolo/${res.code}`);
        });
      }}
    >
      <Input name="name" label="Nome del tavolo (opzionale)" placeholder="Es. Serata tra amici" maxLength={40} />

      <div>
        <label className="text-sm font-medium text-slate-200">Numero massimo di giocatori</label>
        <select
          name="maxPlayers"
          defaultValue={4}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none focus:border-brand-yellow"
        >
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n} className="bg-brand-panel">
              {n} giocatori
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input type="checkbox" name="isPublic" className="h-4 w-4 rounded border-white/20 bg-white/5" />
        Rendi il tavolo pubblico (visibile a tutti nella lista partite)
      </label>

      {error && <p className="text-sm text-card-red">{error}</p>}
      <Button type="submit" loading={pending}>
        Crea tavolo
      </Button>
    </form>
  );
}
