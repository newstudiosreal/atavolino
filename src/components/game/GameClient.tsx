"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlayingCard } from "@/components/cards/PlayingCard";
import { Hand } from "@/components/cards/Hand";
import { Button } from "@/components/ui/Button";
import { PlayerSeat } from "./PlayerSeat";
import { ColorPicker } from "./ColorPicker";
import { TargetPicker } from "./TargetPicker";
import { CardPicker } from "./CardPicker";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { useGameToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { buildTableState, getOwnPlayer } from "@/lib/game/loaders";
import { playCardAction, drawCardAction } from "@/lib/actions/moves";
import { setConnectionStatusAction } from "@/lib/actions/games";
import { COLOR_LABELS } from "@/types/game";
import type { GameCard, GameTableState, OwnPlayer, CardColor } from "@/types/game";

type PendingSpecial =
  | { kind: "jolly"; card: GameCard }
  | { kind: "scambio"; card: GameCard }
  | { kind: "passa"; card: GameCard };

export function GameClient({
  initialTable,
  initialOwn,
  userId
}: {
  initialTable: GameTableState;
  initialOwn: OwnPlayer;
  userId: string;
}) {
  const [table, setTable] = useState(initialTable);
  const [own, setOwn] = useState(initialOwn);
  const [pending, setPending] = useState<PendingSpecial | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useGameToast();

  const isMyTurn = table.currentTurnUserId === userId;

  async function refetch() {
    const supabase = createClient();
    const [fresh, freshOwn] = await Promise.all([
      buildTableState(supabase, table.code),
      getOwnPlayer(supabase, table.id, userId)
    ]);
    if (fresh) setTable(fresh);
    if (freshOwn) setOwn(freshOwn);
  }

  useRealtimeGame(table.id, {
    onGameChange: refetch,
    onPlayersChange: refetch,
    onMoveInsert: async (payload) => {
      const row = payload.new as { action?: string; user_id?: string };
      if (!row?.action) return;
      const messages: Record<string, string> = {
        entra: "Un giocatore è entrato.",
        esce: "Un giocatore ha lasciato il tavolo.",
        pesca: row.user_id === userId ? "Hai pescato una carta." : "Un giocatore ha pescato.",
        vince: "Partita terminata!"
      };
      const msg = messages[row.action];
      if (msg) toast.event(msg);
      await refetch();
    },
    onResultInsert: async () => {
      router.push(`/game/${table.code}/risultati`);
    }
  });

  useEffect(() => {
    const handleUnload = () => setConnectionStatusAction(table.code, false);
    window.addEventListener("beforeunload", handleUnload);
    setConnectionStatusAction(table.code, true);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [table.code]);

  const isPlayable = useMemo(() => {
    return (card: GameCard) => {
      if (!table.topCard) return true;
      if (card.type === "jolly" || card.type === "caos") return true;
      const colorMatches = card.color != null && card.color === table.activeColor;
      if (card.type === "numero") {
        return colorMatches || (table.topCard.type === "numero" && table.topCard.value === card.value);
      }
      return colorMatches || table.topCard.type === card.type;
    };
  }, [table.topCard, table.activeColor]);

  async function handlePlay(card: GameCard, extra?: { chosenColor?: CardColor; targetUserId?: string; passCardId?: string }) {
    setBusy(true);
    const res = await playCardAction({ gameCode: table.code, cardId: card.id, ...extra });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message ?? "Mossa non valida.");
      return;
    }
    setPending(null);
    await refetch();
  }

  function onCardClick(card: GameCard) {
    if (busy || !isMyTurn) return;
    if (!isPlayable(card)) {
      toast.error("Questa carta non è giocabile ora.");
      return;
    }
    if (card.type === "jolly") {
      setPending({ kind: "jolly", card });
      return;
    }
    if (card.type === "scambio") {
      setPending({ kind: "scambio", card });
      return;
    }
    if (card.type === "passa") {
      setPending({ kind: "passa", card });
      return;
    }
    handlePlay(card);
  }

  async function handleDraw() {
    setBusy(true);
    const res = await drawCardAction(table.code);
    setBusy(false);
    if (!res.ok) toast.error(res.message ?? "Impossibile pescare.");
  }

  const others = table.players.filter((p) => p.userId !== userId);

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col px-2 py-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-sm text-slate-300">
          Tavolo <span className="font-semibold text-brand-yellow">#{table.code}</span>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            isMyTurn ? "bg-brand-yellow text-brand-ink" : "bg-white/10 text-white"
          }`}
        >
          {isMyTurn ? "Il tuo turno" : `Turno di ${table.players.find((p) => p.userId === table.currentTurnUserId)?.username ?? "…"}`}
        </div>
      </div>

      {/* Zona avversari */}
      <div className="flex flex-wrap items-start justify-center gap-6 py-4">
        {others.map((p) => (
          <PlayerSeat key={p.id} player={p} isTurn={p.userId === table.currentTurnUserId} />
        ))}
      </div>

      {/* Centro tavolo */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl bg-felt py-10 shadow-inner">
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <PlayingCard card={{ id: "dorso", type: "numero" }} size="lg" faceDown />
            <span className="text-xs text-slate-300">{table.drawPileCount} nel mazzo</span>
          </div>

          <AnimatePresence mode="wait">
            {table.topCard && (
              <motion.div
                key={table.topCard.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <PlayingCard card={table.topCard} size="lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {table.activeColor && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
            Colore attivo: <strong>{COLOR_LABELS[table.activeColor]}</strong>
          </span>
        )}

        <Button onClick={handleDraw} disabled={!isMyTurn || busy} loading={busy}>
          Pesca
        </Button>
      </div>

      {/* Mano del giocatore */}
      <div className="mt-2">
        <Hand cards={own.hand} isMyTurn={isMyTurn} isPlayable={isPlayable} onPlay={onCardClick} />
      </div>

      {pending?.kind === "jolly" && (
        <ColorPicker
          onChoose={(color) => handlePlay(pending.card, { chosenColor: color })}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === "scambio" && (
        <TargetPicker
          title="Scegli chi sfidare a Scambio"
          players={others}
          onChoose={(targetUserId) => handlePlay(pending.card, { targetUserId })}
          onCancel={() => setPending(null)}
        />
      )}
      {pending?.kind === "passa" && (
        <CardPicker
          title="Scegli la carta da passare"
          cards={own.hand.filter((c) => c.id !== pending.card.id)}
          onChoose={(passCardId) => handlePlay(pending.card, { passCardId })}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
