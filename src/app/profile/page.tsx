import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Panel } from "@/components/ui/Panel";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, games_played, games_won, games_lost, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const { data: recentResults } = await supabase
    .from("game_results")
    .select("id, game_id, position, cards_left, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const gamesPlayed = profile?.games_played ?? 0;
  const gamesWon = profile?.games_won ?? 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow font-display text-2xl font-bold text-brand-ink">
          {profile?.username?.slice(0, 2).toUpperCase() ?? "??"}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{profile?.username ?? "Giocatore"}</h1>
          <p className="text-sm text-slate-400">Al tavolo dal {new Date(profile?.created_at ?? Date.now()).toLocaleDateString("it-IT")}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <Panel className="text-center">
          <p className="font-display text-3xl font-bold text-brand-yellow">{gamesPlayed}</p>
          <p className="text-sm text-slate-300">Partite giocate</p>
        </Panel>
        <Panel className="text-center">
          <p className="font-display text-3xl font-bold text-card-green">{gamesWon}</p>
          <p className="text-sm text-slate-300">Vittorie</p>
        </Panel>
        <Panel className="text-center">
          <p className="font-display text-3xl font-bold">{winRate}%</p>
          <p className="text-sm text-slate-300">% vittorie</p>
        </Panel>
      </div>

      <Panel className="mt-8">
        <h2 className="mb-4 font-display font-semibold">Partite recenti</h2>
        {recentResults && recentResults.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {recentResults.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 text-sm">
                <span>{r.position === 1 ? "🥇 Vittoria" : `${r.position}° posto`}</span>
                <span className="text-slate-400">{new Date(r.created_at).toLocaleDateString("it-IT")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Non hai ancora giocato nessuna partita.</p>
        )}
      </Panel>
    </div>
  );
}
