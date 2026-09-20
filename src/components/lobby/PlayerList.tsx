"use client";

import clsx from "clsx";
import type { PublicPlayer } from "@/types/game";

export function PlayerList({ players, maxPlayers }: { players: PublicPlayer[]; maxPlayers: number }) {
  return (
    <div className="flex flex-col gap-2">
      {players.map((p) => (
        <div
          key={p.id}
          className={clsx(
            "flex items-center justify-between rounded-xl px-4 py-2.5",
            p.isConnected ? "bg-white/5" : "bg-white/5 opacity-50"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <span className="font-medium">{p.username}</span>
            {!p.isConnected && <span className="text-xs text-slate-400">(disconnesso)</span>}
          </div>
          {p.isHost && (
            <span className="rounded-full bg-brand-yellow px-2.5 py-0.5 text-xs font-bold text-brand-ink">HOST</span>
          )}
        </div>
      ))}
      {Array.from({ length: Math.max(0, maxPlayers - players.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="rounded-xl border border-dashed border-white/10 px-4 py-2.5 text-slate-500">
          Posto libero
        </div>
      ))}
    </div>
  );
}
