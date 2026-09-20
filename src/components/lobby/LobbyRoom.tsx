"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PlayerList } from "./PlayerList";
import { useRealtimeGame } from "@/hooks/useRealtimeGame";
import { useGameToast } from "@/hooks/useToast";
import { createClient } from "@/lib/supabase/client";
import { buildTableState } from "@/lib/game/loaders";
import { startGameAction, leaveGameAction } from "@/lib/actions/games";
import type { GameTableState } from "@/types/game";

export function LobbyRoom({ initialState, userId }: { initialState: GameTableState; userId: string }) {
  const [state, setState] = useState(initialState);
  const [starting, startTransition] = useTransition();
  const [leaving, startLeaveTransition] = useTransition();
  const router = useRouter();
  const toast = useGameToast();

  const isHost = state.hostId === userId;
  const canStart = state.players.length >= 2 && isHost && state.status === "lobby";

  async function refetch() {
    const supabase = createClient();
    const fresh = await buildTableState(supabase, state.code);
    if (fresh) setState(fresh);
  }

  useRealtimeGame(state.id, {
    onPlayersChange: async (payload) => {
      if (payload.eventType === "INSERT") toast.info("Un giocatore è entrato nel tavolo.");
      if (payload.eventType === "DELETE") toast.info("Un giocatore ha lasciato il tavolo.");
      await refetch();
    },
    onGameChange: async () => {
      await refetch();
    }
  });

  useEffect(() => {
    if (state.status === "in_corso") {
      router.push(`/game/${state.code}`);
    }
  }, [state.status, state.code, router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="text-center">
        <p className="font-display text-sm uppercase tracking-widest text-slate-400">Tavolo</p>
        <h1 className="font-display text-4xl font-extrabold text-brand-yellow">#{state.code}</h1>
        {state.name && <p className="mt-1 text-slate-300">{state.name}</p>}
      </div>

      <Panel className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold">Giocatori</h2>
          <span className="text-sm text-slate-300">
            {state.players.length} / {state.maxPlayers}
          </span>
        </div>

        <PlayerList players={state.players} maxPlayers={state.maxPlayers} />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(state.code);
              toast.success("Codice copiato!");
            }}
          >
            Copia codice
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              const shareData = {
                title: "aTavolino",
                text: `Unisciti al mio tavolo su aTavolino! Codice: ${state.code}`,
                url: typeof window !== "undefined" ? window.location.href : ""
              };
              if (navigator.share) {
                try {
                  await navigator.share(shareData);
                } catch {
                  // annullato dall'utente, nessun errore da mostrare
                }
              } else {
                navigator.clipboard.writeText(shareData.url);
                toast.success("Link copiato!");
              }
            }}
          >
            Invita
          </Button>

          <Button
            variant="danger"
            className="ml-auto"
            loading={leaving}
            onClick={() => {
              startLeaveTransition(async () => {
                await leaveGameAction(state.code);
                router.push("/lobby");
              });
            }}
          >
            Esci dal tavolo
          </Button>
        </div>

        {isHost && (
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={!canStart}
            loading={starting}
            onClick={() => {
              startTransition(async () => {
                const res = await startGameAction(state.code);
                if (!res.ok) toast.error(res.message ?? "Impossibile avviare la partita.");
              });
            }}
          >
            Avvia partita
          </Button>
        )}
        {!isHost && (
          <p className="mt-4 text-center text-sm text-slate-400">In attesa che l&apos;host avvii la partita…</p>
        )}
        {isHost && state.players.length < 2 && (
          <p className="mt-2 text-center text-sm text-slate-400">Servono almeno 2 giocatori per iniziare.</p>
        )}
      </Panel>
    </div>
  );
}
