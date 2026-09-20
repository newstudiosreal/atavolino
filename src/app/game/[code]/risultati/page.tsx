import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGameByCode, getGameResults } from "@/lib/game/loaders";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function ResultsPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const game = await getGameByCode(supabase, params.code);
  if (!game) notFound();

  const results = await getGameResults(supabase, game.id);
  const winner = results.find((r) => r.position === 1);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="font-display text-sm uppercase tracking-widest text-slate-400">🏆 Partita terminata</p>
      {winner && (
        <h1 className="mt-2 font-display text-3xl font-extrabold text-brand-yellow">
          {winner.username.toUpperCase()} HA VINTO!
        </h1>
      )}

      <Panel className="mt-8">
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <div key={r.userId} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <span className="flex items-center gap-2">
                <span className="text-xl">{MEDALS[r.position - 1] ?? `${r.position}°`}</span>
                <span className="font-medium">{r.username}</span>
              </span>
              <span className="text-sm text-slate-400">{r.cardsLeft} carte rimaste</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/lobby">
          <Button variant="secondary">Torna alla lobby</Button>
        </Link>
        <Link href="/lobby?tab=crea">
          <Button>Gioca ancora</Button>
        </Link>
      </div>
    </div>
  );
}
