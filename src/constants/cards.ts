// ============================================================================
// Composizione del mazzo di aTavolino.
//
// Distribuzione ORIGINALE (non replica quella di UNO):
//
//   Per ciascuno dei 4 colori (rosso, blu, verde, giallo):
//     - un solo "0"                              -> 1 carta
//     - due copie di ciascun valore da 1 a 9       -> 2 * 9 = 18 carte
//     = 19 carte numeriche per colore -> 19 * 4 = 76 carte numeriche totali
//
//   Speciali COLORATE (esistono in tutti e 4 i colori, si giocano solo su
//   colore/tipo compatibile, come le numeriche):
//     - SCAMBIO  x2 per colore  -> 8 carte
//     - PASSA    x2 per colore  -> 8 carte
//     - BLOCCO   x2 per colore  -> 8 carte
//     - TAVOLINO x1 per colore  -> 4 carte
//     = 28 carte speciali colorate
//
//   Speciali NEUTRE (nessun colore, giocabili sempre, indipendenti dal turno
//   cromatico):
//     - JOLLY x4
//     - CAOS  x4
//     = 8 carte neutre
//
//   TOTALE MAZZO: 76 + 28 + 8 = 112 carte.
//
// Questa distribuzione è pensata per partite di 2-8 giocatori con mani
// iniziali da 7 carte, mantenendo un buon equilibrio fra carte numeriche e
// carte ad effetto (circa 1 carta su 3 è speciale).
// ============================================================================

import type { CardColor, GameCard } from "@/types/game";
import { CARD_COLORS } from "@/types/game";

export const HAND_SIZE = 7;

let localCounter = 0;
function makeId(prefix: string): string {
  localCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${localCounter.toString(36)}`;
}

export function buildFreshDeck(): GameCard[] {
  const deck: GameCard[] = [];

  for (const color of CARD_COLORS) {
    // Carte numeriche: un 0, due copie di 1-9.
    deck.push({ id: makeId("c"), type: "numero", color, value: 0 });
    for (let value = 1; value <= 9; value += 1) {
      deck.push({ id: makeId("c"), type: "numero", color, value });
      deck.push({ id: makeId("c"), type: "numero", color, value });
    }

    // Speciali colorate.
    for (let i = 0; i < 2; i += 1) {
      deck.push({ id: makeId("c"), type: "scambio", color });
      deck.push({ id: makeId("c"), type: "passa", color });
      deck.push({ id: makeId("c"), type: "blocco", color });
    }
    deck.push({ id: makeId("c"), type: "tavolino", color });
  }

  // Speciali neutre.
  for (let i = 0; i < 4; i += 1) {
    deck.push({ id: makeId("c"), type: "jolly" });
    deck.push({ id: makeId("c"), type: "caos" });
  }

  return deck;
}

export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp!;
  }
  return arr;
}

/** Pesca `count` carte dal mazzo; se finisce, rimescola lo scarto (tranne
 *  l'ultima carta giocata) e lo trasforma nel nuovo mazzo. */
export function drawCards(
  deck: GameCard[],
  discard: GameCard[],
  count: number
): { drawn: GameCard[]; deck: GameCard[]; discard: GameCard[] } {
  let workingDeck = [...deck];
  let workingDiscard = [...discard];
  const drawn: GameCard[] = [];

  for (let i = 0; i < count; i += 1) {
    if (workingDeck.length === 0) {
      if (workingDiscard.length <= 1) {
        // Non c'è più nulla da pescare: ci si ferma (evento raro con 112 carte).
        break;
      }
      const top = workingDiscard[workingDiscard.length - 1]!;
      const rest = workingDiscard.slice(0, -1);
      workingDeck = shuffle(rest);
      workingDiscard = [top];
    }
    const card = workingDeck.pop();
    if (card) drawn.push(card);
  }

  return { drawn, deck: workingDeck, discard: workingDiscard };
}

export function colorLabel(color?: CardColor): string {
  if (!color) return "";
  return color[0]!.toUpperCase() + color.slice(1);
}
