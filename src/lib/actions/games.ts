"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGameCode } from "@/lib/utils/code";
import { UserFacingError, logServerError, toUserMessage } from "@/lib/utils/errors";
import { dealInitialHands } from "@/lib/game/engine";
import type { ActionResult } from "./auth";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new UserFacingError("Devi accedere per eseguire questa azione.");
  return user;
}

export interface CreateGameResult extends ActionResult {
  code?: string;
}

export async function createGameAction(formData: FormData): Promise<CreateGameResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const name = String(formData.get("name") ?? "").trim().slice(0, 40) || null;
    const isPublic = formData.get("isPublic") === "on";
    const maxPlayers = Number(formData.get("maxPlayers") ?? 4);

    if (!Number.isInteger(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) {
      return { ok: false, message: "Il numero di giocatori deve essere tra 2 e 8." };
    }

    // Genera un codice univoco (riprova in caso di rarissima collisione).
    let code = generateGameCode();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data: existing } = await admin.from("games").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = generateGameCode();
    }

    const { data: game, error } = await admin
      .from("games")
      .insert({
        code,
        name,
        host_id: user.id,
        status: "lobby",
        is_public: isPublic,
        max_players: maxPlayers
      })
      .select("id, code")
      .single();

    if (error || !game) throw error ?? new Error("Creazione partita fallita.");

    const { error: joinError } = await admin.from("game_players").insert({
      game_id: game.id,
      user_id: user.id,
      seat: 0,
      is_host: true,
      is_ready: true,
      hand: []
    });
    if (joinError) throw joinError;

    await admin.from("game_moves").insert({
      game_id: game.id,
      user_id: user.id,
      action: "entra"
    });

    revalidatePath("/lobby");
    return { ok: true, code: game.code };
  } catch (err) {
    logServerError("createGameAction", err);
    return { ok: false, message: toUserMessage(err, "Impossibile creare il tavolo. Riprova.") };
  }
}

export interface JoinGameResult extends ActionResult {
  code?: string;
}

export async function joinGameAction(formData: FormData): Promise<JoinGameResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const rawCode = String(formData.get("code") ?? "").trim().toUpperCase();
    if (!rawCode) return { ok: false, message: "Inserisci il codice del tavolo." };

    const { data: game, error: gameError } = await admin
      .from("games")
      .select("id, code, status, max_players")
      .eq("code", rawCode)
      .maybeSingle();

    if (gameError) throw gameError;
    if (!game) return { ok: false, message: "Nessun tavolo trovato con questo codice." };
    if (game.status !== "lobby") return { ok: false, message: "Questa partita è già iniziata o è terminata." };

    const { data: players, error: playersError } = await admin
      .from("game_players")
      .select("id, user_id, seat")
      .eq("game_id", game.id);
    if (playersError) throw playersError;

    const already = players?.find((p) => p.user_id === user.id);
    if (already) {
      return { ok: true, code: game.code };
    }

    if ((players?.length ?? 0) >= game.max_players) {
      return { ok: false, message: "Il tavolo è già al completo." };
    }

    const usedSeats = new Set((players ?? []).map((p) => p.seat));
    let seat = 0;
    while (usedSeats.has(seat)) seat += 1;

    const { error: insertError } = await admin.from("game_players").insert({
      game_id: game.id,
      user_id: user.id,
      seat,
      is_host: false,
      is_ready: true,
      hand: []
    });
    if (insertError) throw insertError;

    await admin.from("game_moves").insert({ game_id: game.id, user_id: user.id, action: "entra" });

    revalidatePath(`/lobby/tavolo/${game.code}`);
    return { ok: true, code: game.code };
  } catch (err) {
    logServerError("joinGameAction", err);
    return { ok: false, message: toUserMessage(err, "Impossibile unirsi al tavolo. Riprova.") };
  }
}

export async function leaveGameAction(gameCode: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data: game, error: gameError } = await admin
      .from("games")
      .select("id, status, host_id")
      .eq("code", gameCode)
      .maybeSingle();
    if (gameError) throw gameError;
    if (!game) return { ok: false, message: "Partita inesistente." };

    const { data: players, error: playersError } = await admin
      .from("game_players")
      .select("id, user_id, seat, is_host")
      .eq("game_id", game.id)
      .order("seat", { ascending: true });
    if (playersError) throw playersError;

    const me = players?.find((p) => p.user_id === user.id);
    if (!me) return { ok: true }; // già fuori

    await admin.from("game_players").delete().eq("id", me.id);
    await admin.from("game_moves").insert({ game_id: game.id, user_id: user.id, action: "esce" });

    const remaining = (players ?? []).filter((p) => p.id !== me.id);

    if (remaining.length === 0) {
      // Tavolo vuoto: lo eliminiamo per non lasciare partite fantasma.
      await admin.from("games").delete().eq("id", game.id);
    } else if (me.is_host) {
      // L'host se ne va: passa l'host al giocatore con seat più basso.
      const newHost = [...remaining].sort((a, b) => a.seat - b.seat)[0]!;
      await admin.from("games").update({ host_id: newHost.user_id }).eq("id", game.id);
      await admin.from("game_players").update({ is_host: true }).eq("id", newHost.id);
    }

    revalidatePath(`/lobby/tavolo/${gameCode}`);
    return { ok: true };
  } catch (err) {
    logServerError("leaveGameAction", err);
    return { ok: false, message: toUserMessage(err) };
  }
}

export async function startGameAction(gameCode: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data: game, error: gameError } = await admin
      .from("games")
      .select("id, host_id, status")
      .eq("code", gameCode)
      .maybeSingle();
    if (gameError) throw gameError;
    if (!game) return { ok: false, message: "Partita inesistente." };
    if (game.host_id !== user.id) return { ok: false, message: "Solo l'host può avviare la partita." };
    if (game.status !== "lobby") return { ok: false, message: "La partita è già iniziata." };

    const { data: players, error: playersError } = await admin
      .from("game_players")
      .select("id, user_id, seat")
      .eq("game_id", game.id)
      .order("seat", { ascending: true });
    if (playersError) throw playersError;

    if (!players || players.length < 2) {
      return { ok: false, message: "Servono almeno 2 giocatori per iniziare." };
    }

    const dealt = dealInitialHands(players.map((p) => ({ userId: p.user_id, seat: p.seat })));

    for (const p of players) {
      const { error } = await admin
        .from("game_players")
        .update({ hand: dealt.hands[p.user_id] ?? [] })
        .eq("id", p.id);
      if (error) throw error;
    }

    const firstPlayer = players[0]!;
    const topCard = dealt.discard[dealt.discard.length - 1];

    const { error: updateError } = await admin
      .from("games")
      .update({
        status: "in_corso",
        deck_state: dealt.deck,
        discard_pile: dealt.discard,
        active_color: topCard?.color ?? null,
        current_turn_user_id: firstPlayer.user_id,
        started_at: new Date().toISOString()
      })
      .eq("id", game.id);
    if (updateError) throw updateError;

    await admin.from("game_moves").insert({ game_id: game.id, action: "avvia" });

    revalidatePath(`/lobby/tavolo/${gameCode}`);
    revalidatePath(`/game/${gameCode}`);
    return { ok: true };
  } catch (err) {
    logServerError("startGameAction", err);
    return { ok: false, message: toUserMessage(err, "Impossibile avviare la partita. Riprova.") };
  }
}

/** Da chiamare quando un client rileva una disconnessione/riconnessione (best effort). */
export async function setConnectionStatusAction(gameCode: string, connected: boolean): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const admin = createAdminClient();

    const { data: game } = await admin.from("games").select("id").eq("code", gameCode).maybeSingle();
    if (!game) return { ok: true };

    await admin
      .from("game_players")
      .update({ is_connected: connected })
      .eq("game_id", game.id)
      .eq("user_id", user.id);

    return { ok: true };
  } catch (err) {
    logServerError("setConnectionStatusAction", err);
    return { ok: false };
  }
}
