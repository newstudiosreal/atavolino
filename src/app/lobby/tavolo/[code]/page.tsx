import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildTableState } from "@/lib/game/loaders";
import { LobbyRoom } from "@/components/lobby/LobbyRoom";

export default async function LobbyTablePage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const state = await buildTableState(supabase, params.code);
  if (!state) notFound();

  if (state.status === "in_corso") redirect(`/game/${state.code}`);
  if (state.status === "terminata") redirect(`/game/${state.code}/risultati`);

  const isParticipant = state.players.some((p) => p.userId === user.id);
  if (!isParticipant) {
    // L'utente ha il link ma non ha ancora fatto il join: lo mandiamo al
    // flusso di ingresso col codice precompilato.
    redirect(`/lobby?code=${state.code}`);
  }

  return <LobbyRoom initialState={state} userId={user.id} />;
}
