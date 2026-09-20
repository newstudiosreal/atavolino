// Funzioni di lettura dati condivise fra Server Components e componenti
// client (che le richiamano dopo un evento realtime). Rispettano sempre la
// RLS: usano il client "server" o "browser", mai quello admin.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { GameCard, GameTableState, OwnPlayer, PublicPlayer, GameResultRow } from "@/types/game";

type Client = SupabaseClient<Database>;

export async function getGameByCode(supabase: Client, code: string) {
  const { data, error } = await supabase
    .from("games")
    .select(
      "id, code, name, host_id, status, is_public, max_players, current_turn_user_id, active_color, discard_pile, deck_state, created_at, started_at, ended_at"
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPublicPlayers(supabase: Client, gameId: string): Promise<PublicPlayer[]> {
  const { data, error } = await supabase
    .from("game_players_public")
    .select("id, game_id, user_id, seat, is_ready, is_host, is_connected, shield, card_count")
    .eq("game_id", gameId)
    .order("seat", { ascending: true });
  if (error) throw error;

  const userIds = (data ?? []).map((p) => p.user_id);
  const profiles = userIds.length
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] as { id: string; username: string; avatar_url: string | null }[] };

  const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));

  return (data ?? []).map((p) => ({
    id: p.id,
    gameId: p.game_id,
    userId: p.user_id,
    username: profileMap.get(p.user_id)?.username ?? "Giocatore",
    avatarUrl: profileMap.get(p.user_id)?.avatar_url ?? null,
    seat: p.seat,
    cardCount: p.card_count,
    isReady: p.is_ready,
    isHost: p.is_host,
    isConnected: p.is_connected,
    shield: p.shield
  }));
}

export async function getOwnPlayer(
  supabase: Client,
  gameId: string,
  userId: string
): Promise<OwnPlayer | null> {
  const { data, error } = await supabase
    .from("game_players")
    .select("id, game_id, user_id, seat, hand, is_ready, is_host, is_connected, shield")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return {
    id: data.id,
    gameId: data.game_id,
    userId: data.user_id,
    username: profile?.username ?? "Tu",
    avatarUrl: profile?.avatar_url ?? null,
    seat: data.seat,
    cardCount: ((data.hand as GameCard[]) ?? []).length,
    isReady: data.is_ready,
    isHost: data.is_host,
    isConnected: data.is_connected,
    shield: data.shield,
    hand: (data.hand as GameCard[]) ?? []
  };
}

export async function buildTableState(supabase: Client, code: string): Promise<GameTableState | null> {
  const game = await getGameByCode(supabase, code);
  if (!game) return null;

  const players = await getPublicPlayers(supabase, game.id);
  const discard = (game.discard_pile as GameCard[]) ?? [];
  const deck = (game.deck_state as GameCard[]) ?? [];

  return {
    id: game.id,
    code: game.code,
    name: game.name,
    hostId: game.host_id,
    status: game.status,
    isPublic: game.is_public,
    maxPlayers: game.max_players,
    currentTurnUserId: game.current_turn_user_id,
    activeColor: game.active_color,
    topCard: discard.length > 0 ? discard[discard.length - 1]! : null,
    drawPileCount: deck.length,
    pendingEffect: null,
    players,
    createdAt: game.created_at,
    startedAt: game.started_at,
    endedAt: game.ended_at
  };
}

export async function getGameResults(supabase: Client, gameId: string): Promise<GameResultRow[]> {
  const { data, error } = await supabase
    .from("game_results")
    .select("user_id, position, cards_left")
    .eq("game_id", gameId)
    .order("position", { ascending: true });
  if (error) throw error;

  const userIds = (data ?? []).map((r) => r.user_id);
  const profiles = userIds.length
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds)
    : { data: [] as { id: string; username: string; avatar_url: string | null }[] };
  const profileMap = new Map((profiles.data ?? []).map((p) => [p.id, p]));

  return (data ?? []).map((r) => ({
    userId: r.user_id,
    username: profileMap.get(r.user_id)?.username ?? "Giocatore",
    avatarUrl: profileMap.get(r.user_id)?.avatar_url ?? null,
    position: r.position,
    cardsLeft: r.cards_left
  }));
}
