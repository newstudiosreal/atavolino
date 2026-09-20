// Messaggi d'errore mostrati all'utente: sempre in italiano, mai dettagli
// tecnici (stack trace, messaggi Postgres, ecc.) che vengono invece loggati
// lato server con console.error.

export class UserFacingError extends Error {}

export function toUserMessage(err: unknown, fallback = "Si è verificato un errore imprevisto. Riprova."): string {
  if (err instanceof UserFacingError) return err.message;
  return fallback;
}

export function logServerError(context: string, err: unknown) {
  // In produzione questo può essere collegato a un servizio di logging.
  console.error(`[aTavolino] ${context}:`, err);
}
