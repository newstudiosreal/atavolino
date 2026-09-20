"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserFacingError, logServerError, toUserMessage } from "@/lib/utils/errors";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Lista minima di parole non ammesse negli username. In produzione andrebbe
// estesa o sostituita con un servizio di moderazione dedicato.
const BLOCKED_USERNAMES = new Set(["admin", "moderatore", "supabase", "atavolino", "newstudios"]);

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_REGEX.test(username)) {
    return { ok: false, message: "Lo username deve avere 3-20 caratteri (lettere, numeri, underscore)." };
  }
  if (BLOCKED_USERNAMES.has(username.toLowerCase())) {
    return { ok: false, message: "Questo username non è disponibile." };
  }
  if (!email.includes("@")) {
    return { ok: false, message: "Inserisci un indirizzo email valido." };
  }
  if (password.length < 8) {
    return { ok: false, message: "La password deve avere almeno 8 caratteri." };
  }

  try {
    const supabase = await createClient();

    const { data: available, error: checkError } = await supabase.rpc("is_username_available", {
      candidate: username
    });
    if (checkError) throw checkError;
    if (!available) {
      return { ok: false, message: "Questo username è già in uso." };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    if (error) throw error;

    return { ok: true, message: "Registrazione completata! Controlla la tua email per confermare l'account." };
  } catch (err) {
    logServerError("registerAction", err);
    return { ok: false, message: toUserMessage(err, "Impossibile completare la registrazione. Riprova.") };
  }
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Inserisci email e password." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, message: "Email o password non corrette." };
    }
    return { ok: true };
  } catch (err) {
    logServerError("loginAction", err);
    return { ok: false, message: toUserMessage(err) };
  }
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { ok: true };
  } catch (err) {
    logServerError("logoutAction", err);
    return { ok: false, message: toUserMessage(err) };
  }
}

export async function requestPasswordResetAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) {
    return { ok: false, message: "Inserisci un indirizzo email valido." };
  }
  try {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/recupero-password/conferma`
    });
    // Risposta sempre positiva per non rivelare quali email sono registrate.
    return { ok: true, message: "Se l'indirizzo è registrato, riceverai una email per reimpostare la password." };
  } catch (err) {
    logServerError("requestPasswordResetAction", err);
    return { ok: true, message: "Se l'indirizzo è registrato, riceverai una email per reimpostare la password." };
  }
}

/** Usata solo internamente da altre server action per ottenere l'utente corrente in modo sicuro. */
export async function getCurrentUserOrThrow() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new UserFacingError("Devi accedere per eseguire questa azione.");
  return user;
}

export async function getAdmin() {
  return createAdminClient();
}
