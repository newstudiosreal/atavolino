"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import type { GameCard } from "@/types/game";

const COLOR_BG: Record<string, string> = {
  rosso: "bg-card-red",
  blu: "bg-card-blue",
  verde: "bg-card-green",
  giallo: "bg-card-yellow"
};

const TYPE_ICON: Record<string, string> = {
  scambio: "🔄",
  caos: "🎲",
  passa: "➡️",
  jolly: "🃏",
  tavolino: "💥",
  blocco: "🛡️"
};

interface Props {
  card: GameCard;
  size?: "sm" | "md" | "lg";
  faceDown?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-14 text-xs",
  md: "w-16 h-24 text-lg",
  lg: "w-20 h-28 text-xl"
};

export function PlayingCard({ card, size = "md", faceDown, selected, disabled, onClick, className }: Props) {
  if (faceDown) {
    return (
      <div
        className={clsx(
          sizeClasses[size],
          "rounded-card border-2 border-white/20 bg-gradient-to-br from-brand-panel to-brand-ink shadow-card flex items-center justify-center select-none",
          className
        )}
      >
        <span className="font-display font-bold text-brand-yellow/80" style={{ fontSize: "0.7em" }}>
          aT
        </span>
      </div>
    );
  }

  const bg = card.color ? COLOR_BG[card.color] : "bg-card-neutral";
  const label = card.type === "numero" ? String(card.value) : TYPE_ICON[card.type] ?? "?";

  return (
    <motion.button
      type="button"
      whileHover={disabled ? undefined : { y: -8 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        sizeClasses[size],
        bg,
        "rounded-card shadow-card border-2 flex flex-col items-center justify-center font-display font-bold text-white select-none transition-shadow",
        selected ? "border-brand-yellow ring-4 ring-brand-yellow/40 -translate-y-2" : "border-white/20",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        className
      )}
      aria-label={card.type === "numero" ? `Carta ${card.color} ${card.value}` : `Carta speciale ${card.type}`}
    >
      <span style={{ fontSize: "1.6em" }}>{label}</span>
      {card.type !== "numero" && card.color && (
        <span className="mt-0.5 rounded-full bg-black/20 px-1.5 text-[0.55em] uppercase tracking-wide">
          {card.color}
        </span>
      )}
    </motion.button>
  );
}
