"use client";

import clsx from "clsx";
import { PlayingCard } from "@/components/cards/PlayingCard";
import type { PublicPlayer } from "@/types/game";

export function PlayerSeat({ player, isTurn }: { player: PublicPlayer; isTurn: boolean }) {
  return (
    <div className={clsx("flex flex-col items-center gap-1", !player.isConnected && "opacity-50")}>
      <div
        className={clsx(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
          isTurn ? "bg-brand-yellow text-brand-ink" : "bg-white/10 text-white"
        )}
      >
        {player.shield && <span title="Protetto da Blocco">🛡️</span>}
        <span>{player.username}</span>
      </div>
      <div className="flex -space-x-6">
        {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
          <PlayingCard key={i} card={{ id: `${player.id}-${i}`, type: "numero" }} size="sm" faceDown />
        ))}
      </div>
      <span className="text-xs text-slate-400">{player.cardCount} carte</span>
    </div>
  );
}
