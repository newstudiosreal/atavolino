"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Qualcosa è andato storto</h1>
      <p className="mt-3 text-slate-300">
        Si è verificato un errore imprevisto. Puoi riprovare oppure tornare alla lobby.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        Riprova
      </Button>
    </div>
  );
}
