import { customAlphabet } from "nanoid";

// Alfabeto senza caratteri ambigui (niente 0/O, 1/I/L) per codici tavolo
// facili da leggere e condividere a voce o per iscritto.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(ALPHABET, 5);

export function generateGameCode(): string {
  return generate();
}
