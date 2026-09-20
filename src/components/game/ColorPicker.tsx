"use client";

import { CARD_COLORS, COLOR_LABELS } from "@/types/game";
import type { CardColor } from "@/types/game";

const DOT_CLASS: Record<CardColor, string> = {
  rosso: "bg-card-red",
  blu: "bg-card-blue",
  verde: "bg-card-green",
  giallo: "bg-card-yellow"
};

export function ColorPicker({ onChoose, onCancel }: { onChoose: (c: CardColor) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-brand-panel p-6 shadow-panel">
        <h3 className="mb-4 text-center font-display text-lg font-semibold">Scegli il colore</h3>
        <div className="grid grid-cols-2 gap-3">
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChoose(c)}
              className={`flex items-center justify-center gap-2 rounded-xl py-4 font-display font-semibold text-white ${DOT_CLASS[c]}`}
            >
              {COLOR_LABELS[c]}
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
