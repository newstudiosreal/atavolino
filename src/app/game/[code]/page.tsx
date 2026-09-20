import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildTableState, getOwnPlayer } from "@/lib/game/loaders";
import { GameClient } from "@/components/game/GameClient";

export default async function GamePage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const table = await buildTableState(supabase, params.code);
  if (!table) notFound();

  if (table.status === "lobby") redirect(`/lobby/tavolo/${table.code}`);
  if (table.status === "terminata") redirect(`/game/${table.code}/risultati`);

  const own = await getOwnPlayer(supabase, table.id, user.id);
  if (!own) redirect("/lobby");

  return <GameClient initialTable={table} initialOwn={own} userId={user.id} />;
}
