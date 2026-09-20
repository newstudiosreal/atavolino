"use client";

import { PlayingCard } from "@/components/cards/PlayingCard";
import type { GameCard } from "@/types/game";

export function CardPicker({
  title,
  cards,
  onChoose,
  onCancel
}: {
  title: string;
  cards: GameCard[];
  onChoose: (cardId: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-brand-panel p-6 shadow-panel">
        <h3 className="mb-4 text-center font-display text-lg font-semibold">{title}</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {cards.map((c) => (
            <PlayingCard key={c.id} card={c} size="sm" onClick={() => onChoose(c.id)} />
          ))}
        </div>
        <button onClick={onCancel} className="mt-4 w-full text-sm text-slate-400 hover:text-white">
          Annulla
        </button>
      </div>
    </div>
  );
}
