import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Gestisce il redirect dopo la conferma email o il link di reset password
// inviato da Supabase Auth.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/lobby";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
