import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="flex flex-col items-center text-center">
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-brand-yellow sm:text-6xl">
          aTavolino
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-200">
          Il gioco di carte dove il tavolo è sempre aperto.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <>
              <Link href="/lobby?tab=crea">
                <Button size="lg">Crea partita</Button>
              </Link>
              <Link href="/lobby?tab=unisciti">
                <Button size="lg" variant="secondary">
                  Unisciti a una partita
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/register">
                <Button size="lg">Gioca</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary">
                  Accedi
                </Button>
              </Link>
            </>
          )}
          <Link href="/regole">
            <Button size="lg" variant="ghost">
              Come si gioca
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button size="lg" variant="ghost">
              Classifiche
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-4">
        {[
          { n: 1, t: "Crea un tavolo", d: "Scegli i giocatori massimi e ottieni un codice da condividere." },
          { n: 2, t: "Invita i tuoi amici", d: "Basta il codice del tavolo per unirsi, da PC o smartphone." },
          { n: 3, t: "Gioca", d: "Carte numeriche e speciali, in tempo reale, senza attese." },
          { n: 4, t: "Svuota la mano", d: "Gioca le tue carte e cerca di essere il primo a restare senza carte in mano." }
        ].map((s) => (
          <Panel key={s.n} className="text-center">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow font-display font-bold text-brand-ink">
              {s.n}
            </div>
            <h3 className="font-display font-semibold">{s.t}</h3>
            <p className="mt-1 text-sm text-slate-300">{s.d}</p>
          </Panel>
        ))}
      </section>
    </div>
  );
}
