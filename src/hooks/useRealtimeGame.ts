"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface Handlers {
  onGameChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onPlayersChange?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onMoveInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  onResultInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
}

/**
 * Sottoscrive un canale Supabase Realtime per un tavolo specifico e invoca
 * gli handler forniti quando cambiano games / game_players / game_moves /
 * game_results relativi a quella partita. Il refetch dei dati (via router
 * refresh o query mirate) resta a carico del chiamante: qui ci occupiamo
 * solo di "sapere quando è successo qualcosa".
 */
export function useRealtimeGame(gameId: string | null, handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!gameId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`tavolo:${gameId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => handlersRef.current.onGameChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_players", filter: `game_id=eq.${gameId}` },
        (payload) => handlersRef.current.onPlayersChange?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_moves", filter: `game_id=eq.${gameId}` },
        (payload) => handlersRef.current.onMoveInsert?.(payload)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_results", filter: `game_id=eq.${gameId}` },
        (payload) => handlersRef.current.onResultInsert?.(payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
}
