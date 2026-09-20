"use client";

import { useState } from "react";
import { PlayingCard } from "./PlayingCard";
import type { GameCard } from "@/types/game";

interface Props {
  cards: GameCard[];
  isMyTurn: boolean;
  isPlayable: (card: GameCard) => boolean;
  onPlay: (card: GameCard) => void;
}

export function Hand({ cards, isMyTurn, isPlayable, onPlay }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="flex w-full items-end justify-center gap-1 overflow-x-auto px-2 py-3 sm:gap-2"
      role="list"
      aria-label="La tua mano"
    >
      {cards.map((card) => {
        const playable = isMyTurn && isPlayable(card);
        return (
          <div
            key={card.id}
            className="shrink-0 transition-transform"
            style={{ transform: hovered === card.id ? "translateY(-6px)" : undefined }}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <PlayingCard
              card={card}
              size="md"
              disabled={!playable}
              onClick={() => playable && onPlay(card)}
            />
          </div>
        );
      })}
      {cards.length === 0 && <p className="text-sm text-slate-300">Non hai più carte.</p>}
    </div>
  );
}
