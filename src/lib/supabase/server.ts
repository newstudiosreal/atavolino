// Client Supabase per Server Components / Route Handlers / Server Actions,
// che opera nel contesto dell'utente autenticato (rispetta la RLS).
// NON usa la service role key: per operazioni privilegiate vedi admin.ts.
//
// NOTA: cookies() da next/headers è asincrona a partire da Next.js 15
// (in Next 14 restituisce comunque un valore "await-abile" senza problemi),
// quindi createClient() è async: ogni chiamante deve usare
// `const supabase = await createClient()`.

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chiamato da un Server Component: la sessione viene comunque
            // aggiornata dal middleware, questo errore può essere ignorato.
          }
        }
      }
    }
  );
}
