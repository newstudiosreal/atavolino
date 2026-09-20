import "server-only";

// Client Supabase con la Service Role Key: bypassa la Row Level Security.
// USATO SOLO ED ESCLUSIVAMENTE all'interno delle Server Actions
// (src/lib/actions/*), MAI in un componente client, MAI esposto al browser.
// L'import "server-only" fa fallire la build se questo file viene importato
// per errore da codice client.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Configurazione Supabase mancante: verifica NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nelle variabili d'ambiente del server."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
