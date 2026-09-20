"use client";

// Client Supabase per componenti React lato browser.
// Usa solo URL + anon key (pubbliche per design): la sicurezza è garantita
// dalle Row Level Security policy sul database, non dal nascondere questa
// chiave.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
