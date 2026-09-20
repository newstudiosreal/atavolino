// ============================================================================
// Tipi di dominio del gioco aTavolino.
// Questo file NON dipende da Supabase: descrive solo il modello di gioco.
// ============================================================================

export type CardColor = "rosso" | "blu" | "verde" | "giallo";

// Carte numeriche (0-9, in uno dei 4 colori) + carte speciali originali.
export type CardType =
  | "numero"
  | "scambio"
  | "caos"
  | "passa"
  | "jolly"
  | "tavolino"
  | "blocco";

export interface GameCard {
  /** Identificativo univoco dell'istanza di carta nel mazzo (non del "tipo"). */
  id: string;
  type: CardType;
  /** Presente solo per le carte "numero" e per le speciali colorate. */
  color?: CardColor;
  /** Presente solo per le carte "numero" (0-9). */
  value?: number;
}

export type PlayerAction =
  | "gioca_carta"
  | "pesca"
  | "scambio"
  | "caos"
  | "passa_carta"
  | "jolly"
  | "tavolino"
  | "blocco"
  | "entra"
  | "esce"
  | "avvia"
  | "vince";

export type GameStatus = "lobby" | "in_corso" | "terminata";

export interface PublicPlayer {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  seat: number;
  cardCount: number;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
  shield: boolean;
}

/** Vista completa disponibile solo al proprietario della mano. */
export interface OwnPlayer extends PublicPlayer {
  hand: GameCard[];
}

export interface PendingEffect {
  /** L'effetto CAOS o l'attesa scelta colore dopo un JOLLY, es. */
  type: "scegli_colore" | "nessuno";
  byUserId?: string;
}

export interface GameTableState {
  id: string;
  code: string;
  name: string | null;
  hostId: string;
  status: GameStatus;
  isPublic: boolean;
  maxPlayers: number;
  currentTurnUserId: string | null;
  activeColor: CardColor | null;
  topCard: GameCard | null;
  drawPileCount: number;
  pendingEffect: PendingEffect | null;
  players: PublicPlayer[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface GameResultRow {
  userId: string;
  username: string;
  avatarUrl: string | null;
  position: number;
  cardsLeft: number;
}

export const CARD_COLORS: CardColor[] = ["rosso", "blu", "verde", "giallo"];

export const COLOR_LABELS: Record<CardColor, string> = {
  rosso: "Rosso",
  blu: "Blu",
  verde: "Verde",
  giallo: "Giallo"
};

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  numero: "Numero",
  scambio: "Scambio",
  caos: "Caos",
  passa: "Passa",
  jolly: "Jolly",
  tavolino: "Tavolino",
  blocco: "Blocco"
};
