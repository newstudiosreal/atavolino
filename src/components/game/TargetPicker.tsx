"use client";

import type { PublicPlayer } from "@/types/game";

export function TargetPicker({
  title,
  players,
  onChoose,
  onCancel
}: {
  title: string;
  players: PublicPlayer[];
  onChoose: (userId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-brand-panel p-6 shadow-panel">
        <h3 className="mb-4 text-center font-display text-lg font-semibold">{title}</h3>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <button
              key={p.userId}
              onClick={() => onChoose(p.userId)}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5 hover:bg-white/10"
            >
              <span>{p.username}</span>
              <span className="text-xs text-slate-400">{p.cardCount} carte</span>
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full text-sm text-slate-400 hover:text-white">
          Annulla
        </button>
      </div>
    </div>
  );
}
