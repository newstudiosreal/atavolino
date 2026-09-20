"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserFacingError, logServerError, toUserMessage } from "@/lib/utils/errors";
import {
  GameEngineError,
  computeFinalStandings,
  drawAndPass,
  playCard,
  type EngineTableState
} from "@/lib/game/engine";
import type { ActionResult } from "./auth";
import type { CardColor, GameCard } from "@/types/game";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new UserFacingError("Devi accedere per eseguire questa azione.");
  return user;
}

async function loadEngineState(admin: ReturnType<typeof createAdminClient>, gameCode: string) {
  const { data: game, error: gameError } = await admin
    .from("games")
    .select("id, code, status, deck_state, discard_pile, active_color, current_turn_user_id")
    .eq("code", gameCode)
    .maybeSingle();
  if (gameError) throw gameError;
  if (!game) throw new UserFacingError("Partita inesistente.");
  if (game.status !== "in_corso") throw new UserFacingError("La partita non è in corso.");

  const { data: players, error: playersError } = await admin
    .from("game_players")
    .select("user_id, seat, hand, shield, is_connected")
    .eq("game_id", game.id);
  if (playersError) throw playersError;
  if (!players || players.length === 0) throw new UserFacingError("Nessun giocatore trovato per questa partita.");

  const state: EngineTableState = {
    players: players.map((p) => ({
      userId: p.user_id,
      seat: p.seat,
      hand: (p.hand as GameCard[]) ?? [],
      shield: p.shield,
      isConnected: p.is_connected
    })),
    deck: (game.deck_state as GameCard[]) ?? [],
    discard: (game.discard_pile as GameCard[]) ?? [],
    activeColor: game.active_color,
    currentTurnUserId: game.current_turn_user_id ?? ""
  };

  return { game, state };
}

async function persistEngineState(
  admin: ReturnType<typeof createAdminClient>,
  gameId: string,
  state: EngineTableState
) {
  for (const p of state.players) {
    const { error } = await admin
      .from("game_players")
      .update({ hand: p.hand, shield: p.shield })
      .eq("game_id", gameId)
      .eq("user_id", p.userId);
    if (error) throw error;
  }

  const { error: gameUpdateError } = await admin
    .from("games")
    .update({
      deck_state: state.deck,
      discard_pile: state.discard,
      active_color: state.activeColor,
      current_turn_user_id: state.currentTurnUserId
    })
    .eq("id", gameId);
  if (gameUpdateError) throw gameUpdateError;
}

async function finalizeGame(
  admin: ReturnType<typeof createAdminClient>,
  gameId: string,
  state: EngineTableState,
  winnerUserId: string
) {
  const standings = computeFinalStandings(state.players, winnerUserId);

  for (const s of standings) {
    const { error } = await admin.from("game_results").insert({
      game_id: gameId,
      user_id: s.userId,
      position: s.position,
      cards_left: s.cardsLeft
    });
    if (error) throw error;
  }

  await admin
    .from("games")
    .update({ status: "terminata", ended_at: new Date().toISOString(), current_turn_user_id: null })
    .eq("id", gameId);

  // Aggiorna le statistiche di ogni giocatore (unica scrittura consentita
  // sulle colonne protette, perché eseguita con la service role key).
  for (const s of standings) {
    const { data: profile } = await admin
      .from("profiles")
      .select("games_played, games_won, games_lost")
      .eq("id", s.userId)
      .maybeSingle();
    if (!profile) continue;

    await admin
      .from("profiles")
      .update({
        games_played: profile.games_played + 1,
        games_won: profile.games_won + (s.position === 1 ? 1 : 0),
        games_lost: profile.games_lost + (s.position === 1 ? 0 : 1)
      })
      .eq("id", s.userId);
  }

  await admin.from("game_moves").insert({ game_id: gameId, user_id: winnerUserId, action: "vince" });
}

export interface PlayCardActionInput {
  gameCode: string;
  cardId: string;
  chosenColor?: CardColor;
  targetUserId?: string;
  passCardId?: string;
}

export async function playCardAction(input: PlayCardActionInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();
    const { game, state } = await loadEngineState(admin, input.gameCode);

    const result = playCard(state, {
      userId: user.id,
      cardId: input.cardId,
      chosenColor: input.chosenColor,
      targetUserId: input.targetUserId,
      passCardId: input.passCardId
    });

    await persistEngineState(admin, game.id, result.state);

    const playedCard = result.state.discard[result.state.discard.length - 1] ?? null;
    await admin.from("game_moves").insert({
      game_id: game.id,
      user_id: user.id,
      action: "gioca_carta",
      card: playedCard,
      target_user_id: input.targetUserId ?? null
    });

    if (result.winnerUserId) {
      await finalizeGame(admin, game.id, result.state, result.winnerUserId);
    }

    revalidatePath(`/game/${input.gameCode}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof GameEngineError) {
      return { ok: false, message: err.message };
    }
    logServerError("playCardAction", err);
    return { ok: false, message: toUserMessage(err, "Mossa non valida. Riprova.") };
  }
}

export async function drawCardAction(gameCode: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();
    const { game, state } = await loadEngineState(admin, gameCode);

    const result = drawAndPass(state, user.id);
    await persistEngineState(admin, game.id, result.state);

    await admin.from("game_moves").insert({ game_id: game.id, user_id: user.id, action: "pesca" });

    revalidatePath(`/game/${gameCode}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof GameEngineError) {
      return { ok: false, message: err.message };
    }
    logServerError("drawCardAction", err);
    return { ok: false, message: toUserMessage(err, "Impossibile pescare in questo momento.") };
  }
}
