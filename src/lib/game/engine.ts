// ============================================================================
// Motore di gioco di aTavolino — funzioni pure, senza dipendenze da Supabase.
// Vengono usate ESCLUSIVAMENTE lato server (nelle Server Actions) per
// validare ed eseguire ogni mossa: il client non decide mai l'esito di una
// giocata, può solo proporla.
//
// ----------------------------------------------------------------------------
// REGOLE DI aTavolino (v1.0)
// ----------------------------------------------------------------------------
// 1. Ogni giocatore inizia con 7 carte. Il resto forma il mazzo coperto.
// 2. Si gioca in senso orario secondo l'ordine dei posti (seat), a turno.
// 3. Al proprio turno, un giocatore deve giocare una carta valida oppure,
//    se non ne ha, pescare 1 carta dal mazzo. Dopo la pescata il turno
//    passa automaticamente al giocatore successivo (non si può ripescare
//    né giocare la carta appena pescata nello stesso turno): questo
//    mantiene il ritmo veloce e prevedibile.
// 4. Una carta NUMERO è valida se condivide il colore attivo oppure il
//    valore con la carta in cima allo scarto.
// 5. Le carte SPECIALI COLORATE (scambio, passa, blocco, tavolino) sono
//    valide se condividono il colore attivo con la cima dello scarto,
//    oppure se la cima dello scarto è dello stesso tipo di carta speciale.
// 6. Le carte NEUTRE (jolly, caos) sono sempre giocabili, in qualsiasi
//    momento sia il proprio turno.
// 7. Effetti delle carte speciali:
//      - JOLLY: chi la gioca sceglie il nuovo colore attivo.
//      - SCAMBIO: chi la gioca sceglie un avversario; le due mani si
//        scambiano una carta a testa, scelta casualmente.
//      - PASSA: chi la gioca sceglie una propria carta e la passa al
//        giocatore successivo (che la aggiunge alla propria mano).
//      - TAVOLINO: ogni giocatore passa una carta casuale della propria
//        mano al giocatore alla sua sinistra (seat successivo), tutti
//        insieme.
//      - BLOCCO: il giocatore ottiene uno "scudo" che annulla il prossimo
//        effetto SCAMBIO, PASSA o CAOS diretto contro di lui (si consuma
//        una sola volta).
//      - CAOS: si applica un effetto casuale scelto tra: (a) tutti pescano
//        1 carta, (b) il giocatore di turno pesca 2 carte, (c) il
//        giocatore di turno scambia l'intera mano con un giocatore
//        casuale, (d) nessun effetto ("tavolo tranquillo").
// 8. Dopo qualunque giocata (tranne una pescata), il turno passa al
//    giocatore successivo, salvo diversa indicazione dell'effetto.
// 9. Un giocatore vince non appena rimane senza carte in mano. La partita
//    termina immediatamente: la classifica finale ordina i giocatori
//    rimanenti per numero di carte in mano (meno carte = posizione
//    migliore); a parità di carte vince chi ha il seat più vicino al
//    vincitore in ordine di turno.
// ============================================================================

import type { CardColor, GameCard } from "@/types/game";
import { buildFreshDeck, drawCards, shuffle } from "@/constants/cards";

export interface EnginePlayerState {
  userId: string;
  seat: number;
  hand: GameCard[];
  shield: boolean;
  isConnected: boolean;
}

export interface EngineTableState {
  players: EnginePlayerState[];
  deck: GameCard[];
  discard: GameCard[];
  activeColor: CardColor | null;
  currentTurnUserId: string;
}

export type EngineEventType =
  | "gioca_carta"
  | "pesca"
  | "scambio"
  | "caos"
  | "passa_carta"
  | "jolly"
  | "tavolino"
  | "blocco"
  | "vince";

export interface EngineEvent {
  type: EngineEventType;
  userId?: string;
  targetUserId?: string;
  card?: GameCard;
  detail?: string;
}

export class GameEngineError extends Error {}

function nextSeatUserId(state: EngineTableState, fromUserId: string): string {
  const active = state.players.filter((p) => p.isConnected || p.hand.length > 0);
  const ordered = [...active].sort((a, b) => a.seat - b.seat);
  const idx = ordered.findIndex((p) => p.userId === fromUserId);
  if (idx === -1) throw new GameEngineError("Giocatore non presente al tavolo.");
  const next = ordered[(idx + 1) % ordered.length]!;
  return next.userId;
}

function findPlayer(state: EngineTableState, userId: string): EnginePlayerState {
  const p = state.players.find((pl) => pl.userId === userId);
  if (!p) throw new GameEngineError("Giocatore non presente al tavolo.");
  return p;
}

export function topOfDiscard(state: EngineTableState): GameCard | null {
  return state.discard.length > 0 ? state.discard[state.discard.length - 1]! : null;
}

/** Verifica se una carta è giocabile date le condizioni attuali del tavolo. */
export function isCardPlayable(state: EngineTableState, card: GameCard): boolean {
  if (card.type === "jolly" || card.type === "caos") return true;

  const top = topOfDiscard(state);
  if (!top) return true; // primissima giocata su mazzo vuoto (edge case)

  const colorMatches = card.color != null && card.color === state.activeColor;

  if (card.type === "numero") {
    const valueMatches = top.type === "numero" && top.value === card.value;
    return colorMatches || valueMatches;
  }

  // speciali colorate: scambio, passa, blocco, tavolino
  const typeMatches = top.type === card.type;
  return colorMatches || typeMatches;
}

export function canPlayerMove(state: EngineTableState, userId: string): boolean {
  const player = findPlayer(state, userId);
  return player.hand.some((c) => isCardPlayable(state, c));
}

export interface PlayCardInput {
  userId: string;
  cardId: string;
  /** Obbligatorio se la carta è JOLLY o se il colore attivo va scelto dopo un effetto. */
  chosenColor?: CardColor;
  /** Obbligatorio per SCAMBIO: l'avversario scelto per lo scambio. */
  targetUserId?: string;
  /** Obbligatorio per PASSA: quale carta della propria mano passare (oltre a quella giocata). */
  passCardId?: string;
}

export interface EngineResult {
  state: EngineTableState;
  events: EngineEvent[];
  winnerUserId?: string;
}

function assertTurn(state: EngineTableState, userId: string) {
  if (state.currentTurnUserId !== userId) {
    throw new GameEngineError("Non è il tuo turno.");
  }
}

function removeCard(hand: GameCard[], cardId: string): { card: GameCard; rest: GameCard[] } {
  const idx = hand.findIndex((c) => c.id === cardId);
  if (idx === -1) throw new GameEngineError("Carta non presente nella tua mano.");
  const card = hand[idx]!;
  const rest = [...hand.slice(0, idx), ...hand.slice(idx + 1)];
  return { card, rest };
}

function randomCardIndex(hand: GameCard[]): number {
  return Math.floor(Math.random() * hand.length);
}

/** Applica una giocata di carta, validando tutte le regole lato server. */
export function playCard(state: EngineTableState, input: PlayCardInput): EngineResult {
  assertTurn(state, input.userId);
  const player = findPlayer(state, input.userId);
  const { card, rest } = removeCard(player.hand, input.cardId);

  if (!isCardPlayable(state, card)) {
    throw new GameEngineError("Questa carta non è giocabile ora.");
  }

  const events: EngineEvent[] = [];
  let newState: EngineTableState = {
    ...state,
    players: state.players.map((p) => (p.userId === player.userId ? { ...p, hand: rest } : p)),
    discard: [...state.discard, card]
  };

  // Colore attivo aggiornato in base alla carta giocata.
  if (card.type === "numero" || ["scambio", "passa", "blocco", "tavolino"].includes(card.type)) {
    newState.activeColor = card.color ?? newState.activeColor;
  }

  let advanceTurn = true;
  let winnerUserId: string | undefined;

  switch (card.type) {
    case "jolly": {
      if (!input.chosenColor) {
        throw new GameEngineError("Devi scegliere un colore per il Jolly.");
      }
      newState.activeColor = input.chosenColor;
      events.push({ type: "jolly", userId: player.userId, card, detail: input.chosenColor });
      break;
    }

    case "blocco": {
      newState.players = newState.players.map((p) =>
        p.userId === player.userId ? { ...p, shield: true } : p
      );
      events.push({ type: "blocco", userId: player.userId, card });
      break;
    }

    case "scambio": {
      if (!input.targetUserId) throw new GameEngineError("Devi scegliere un giocatore per lo Scambio.");
      if (input.targetUserId === player.userId) throw new GameEngineError("Non puoi scegliere te stesso.");
      const target = findPlayer(newState, input.targetUserId);

      if (target.shield) {
        newState.players = newState.players.map((p) =>
          p.userId === target.userId ? { ...p, shield: false } : p
        );
        events.push({ type: "scambio", userId: player.userId, targetUserId: target.userId, card, detail: "bloccato" });
        break;
      }

      const me = findPlayer(newState, player.userId);
      if (me.hand.length > 0 && target.hand.length > 0) {
        const myIdx = randomCardIndex(me.hand);
        const targetIdx = randomCardIndex(target.hand);
        const myCard = me.hand[myIdx]!;
        const targetCard = target.hand[targetIdx]!;
        newState.players = newState.players.map((p) => {
          if (p.userId === me.userId) {
            const h = [...p.hand];
            h[myIdx] = targetCard;
            return { ...p, hand: h };
          }
          if (p.userId === target.userId) {
            const h = [...p.hand];
            h[targetIdx] = myCard;
            return { ...p, hand: h };
          }
          return p;
        });
      }
      events.push({ type: "scambio", userId: player.userId, targetUserId: target.userId, card });
      break;
    }

    case "passa": {
      if (!input.passCardId) throw new GameEngineError("Devi scegliere una carta da passare.");
      const me = findPlayer(newState, player.userId);
      const passResult = removeCard(me.hand, input.passCardId);
      const nextUser = nextSeatUserId(newState, player.userId);
      const nextPlayer = findPlayer(newState, nextUser);

      if (nextPlayer.shield) {
        newState.players = newState.players.map((p) => {
          if (p.userId === nextUser) return { ...p, shield: false };
          return p;
        });
        events.push({ type: "passa_carta", userId: player.userId, targetUserId: nextUser, detail: "bloccato" });
      } else {
        newState.players = newState.players.map((p) => {
          if (p.userId === me.userId) return { ...p, hand: passResult.rest };
          if (p.userId === nextUser) return { ...p, hand: [...p.hand, passResult.card] };
          return p;
        });
        events.push({ type: "passa_carta", userId: player.userId, targetUserId: nextUser, card: passResult.card });
      }
      break;
    }

    case "tavolino": {
      const ordered = [...newState.players]
        .filter((p) => p.isConnected || p.hand.length > 0)
        .sort((a, b) => a.seat - b.seat);

      const passes: Record<string, GameCard | null> = {};
      for (const p of ordered) {
        if (p.hand.length === 0) {
          passes[p.userId] = null;
          continue;
        }
        const idx = randomCardIndex(p.hand);
        passes[p.userId] = p.hand[idx]!;
      }

      newState.players = newState.players.map((p) => {
        const givenCard = passes[p.userId];
        const givenIdx = givenCard ? p.hand.findIndex((c) => c.id === givenCard.id) : -1;
        const handAfterGiving = givenIdx >= 0 ? [...p.hand.slice(0, givenIdx), ...p.hand.slice(givenIdx + 1)] : p.hand;

        // trova chi mi passa la carta (il giocatore precedente in ordine di seat)
        const myIdx = ordered.findIndex((op) => op.userId === p.userId);
        const prevPlayer = ordered[(myIdx - 1 + ordered.length) % ordered.length];
        const received = prevPlayer ? passes[prevPlayer.userId] : null;

        return { ...p, hand: received ? [...handAfterGiving, received] : handAfterGiving };
      });

      events.push({ type: "tavolino", userId: player.userId, card });
      break;
    }

    case "caos": {
      const effect = Math.floor(Math.random() * 4);
      if (effect === 0) {
        // tutti pescano 1 carta
        for (const p of newState.players) {
          const res = drawCards(newState.deck, newState.discard, 1);
          newState.deck = res.deck;
          newState.discard = res.discard;
          newState.players = newState.players.map((pp) =>
            pp.userId === p.userId ? { ...pp, hand: [...pp.hand, ...res.drawn] } : pp
          );
        }
        events.push({ type: "caos", userId: player.userId, card, detail: "tutti_pescano_1" });
      } else if (effect === 1) {
        const res = drawCards(newState.deck, newState.discard, 2);
        newState.deck = res.deck;
        newState.discard = res.discard;
        newState.players = newState.players.map((p) =>
          p.userId === player.userId ? { ...p, hand: [...p.hand, ...res.drawn] } : p
        );
        events.push({ type: "caos", userId: player.userId, card, detail: "pesca_2" });
      } else if (effect === 2) {
        const others = newState.players.filter((p) => p.userId !== player.userId);
        if (others.length > 0) {
          const target = others[Math.floor(Math.random() * others.length)]!;
          if (!target.shield) {
            const meHand = findPlayer(newState, player.userId).hand;
            const targetHand = findPlayer(newState, target.userId).hand;
            newState.players = newState.players.map((p) => {
              if (p.userId === player.userId) return { ...p, hand: targetHand };
              if (p.userId === target.userId) return { ...p, hand: meHand };
              return p;
            });
            events.push({ type: "caos", userId: player.userId, targetUserId: target.userId, card, detail: "scambio_mani" });
          } else {
            newState.players = newState.players.map((p) =>
              p.userId === target.userId ? { ...p, shield: false } : p
            );
            events.push({ type: "caos", userId: player.userId, targetUserId: target.userId, card, detail: "bloccato" });
          }
        }
      } else {
        events.push({ type: "caos", userId: player.userId, card, detail: "tavolo_tranquillo" });
      }
      break;
    }

    case "numero":
    default:
      break;
  }

  // Vittoria: chi ha giocato l'ultima carta.
  const meAfter = findPlayer(newState, player.userId);
  if (meAfter.hand.length === 0) {
    winnerUserId = player.userId;
    events.push({ type: "vince", userId: player.userId });
    advanceTurn = false;
  }

  if (advanceTurn) {
    newState.currentTurnUserId = nextSeatUserId(newState, player.userId);
  }

  return { state: newState, events, winnerUserId };
}

export interface DrawResult {
  state: EngineTableState;
  drawn: GameCard[];
}

/** Il giocatore pesca 1 carta perché non ha mosse valide; il turno passa. */
export function drawAndPass(state: EngineTableState, userId: string): DrawResult {
  assertTurn(state, userId);
  const player = findPlayer(state, userId);

  if (canPlayerMove(state, userId)) {
    throw new GameEngineError("Hai ancora una mossa valida disponibile: non puoi pescare.");
  }

  const res = drawCards(state.deck, state.discard, 1);
  const newState: EngineTableState = {
    ...state,
    deck: res.deck,
    discard: res.discard,
    players: state.players.map((p) => (p.userId === player.userId ? { ...p, hand: [...p.hand, ...res.drawn] } : p))
  };
  newState.currentTurnUserId = nextSeatUserId(newState, userId);
  return { state: newState, drawn: res.drawn };
}

export function computeFinalStandings(
  players: EnginePlayerState[],
  winnerUserId: string
): { userId: string; position: number; cardsLeft: number }[] {
  const others = players
    .filter((p) => p.userId !== winnerUserId)
    .sort((a, b) => a.hand.length - b.hand.length || a.seat - b.seat);

  const standings = [{ userId: winnerUserId, position: 1, cardsLeft: 0 }];
  others.forEach((p, idx) => {
    standings.push({ userId: p.userId, position: idx + 2, cardsLeft: p.hand.length });
  });
  return standings;
}

export function dealInitialHands(
  players: { userId: string; seat: number }[]
): { deck: GameCard[]; discard: GameCard[]; hands: Record<string, GameCard[]> } {
  const HAND_SIZE = 7;
  const deck = shuffle(buildFreshDeck());
  const hands: Record<string, GameCard[]> = {};
  let cursor = 0;
  for (const p of players) {
    hands[p.userId] = deck.slice(cursor, cursor + HAND_SIZE);
    cursor += HAND_SIZE;
  }
  const remaining = deck.slice(cursor);

  // La prima carta di scarto deve essere una numerica (per avere un colore
  // e un valore chiari da cui partire); si rimescola finché non lo è.
  let discardStart: GameCard | undefined;
  let workingDeck = remaining;
  while (workingDeck.length > 0) {
    const candidate = workingDeck[workingDeck.length - 1]!;
    if (candidate.type === "numero") {
      discardStart = candidate;
      workingDeck = workingDeck.slice(0, -1);
      break;
    }
    // sposta la carta non idonea in fondo e rimescola
    workingDeck = shuffle(workingDeck);
  }

  return {
    deck: workingDeck,
    discard: discardStart ? [discardStart] : [],
    hands
  };
}
