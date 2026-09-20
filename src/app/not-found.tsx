import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold text-brand-yellow">Tavolo non trovato</h1>
      <p className="mt-3 text-slate-300">
        Il codice inserito non corrisponde a nessuna partita esistente, oppure la partita non è più disponibile.
      </p>
      <Link href="/lobby" className="mt-6">
        <Button>Torna alla lobby</Button>
      </Link>
    </div>
  );
}
