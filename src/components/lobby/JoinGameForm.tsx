"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { joinGameAction } from "@/lib/actions/games";

export function JoinGameForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-4"
      action={(formData: FormData) => {
        setError(null);
        startTransition(async () => {
          const res = await joinGameAction(formData);
          if (!res.ok || !res.code) {
            setError(res.message ?? "Impossibile unirsi al tavolo.");
            return;
          }
          router.push(`/lobby/tavolo/${res.code}`);
        });
      }}
    >
      <Input
        name="code"
        label="Codice tavolo"
        placeholder="Es. X7K2P"
        maxLength={5}
        className="text-center font-display text-2xl uppercase tracking-[0.3em]"
        style={{ textTransform: "uppercase" }}
        required
      />
      {error && <p className="text-sm text-card-red">{error}</p>}
      <Button type="submit" loading={pending}>
        Unisciti
      </Button>
    </form>
  );
}
