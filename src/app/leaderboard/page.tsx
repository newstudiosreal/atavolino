import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui/Panel";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, games_played, games_won")
    .gt("games_played", 0)
    .order("games_won", { ascending: false })
    .limit(50);

  const rows = (profiles ?? []).map((p) => ({
    ...p,
    winRate: p.games_played > 0 ? Math.round((p.games_won / p.games_played) * 100) : 0
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-center font-display text-3xl font-bold text-brand-yellow">Classifiche</h1>
      <p className="mt-2 text-center text-slate-300">La classifica globale dei giocatori di aTavolino.</p>

      <Panel className="mt-8">
        {rows.length === 0 ? (
          <p className="text-center text-slate-400">Nessuna partita giocata ancora. Sii il primo!</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="pb-2">#</th>
                <th className="pb-2">Giocatore</th>
                <th className="pb-2 text-right">Vittorie</th>
                <th className="pb-2 text-right">Partite</th>
                <th className="pb-2 text-right">% vittorie</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="py-2">{i + 1}</td>
                  <td className="py-2 font-medium">{r.username}</td>
                  <td className="py-2 text-right">{r.games_won}</td>
                  <td className="py-2 text-right">{r.games_played}</td>
                  <td className="py-2 text-right">{r.winRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
