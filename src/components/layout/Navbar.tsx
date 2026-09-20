import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-display text-xl font-extrabold tracking-tight text-brand-yellow">
          aTavolino
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/regole" className="hidden rounded-full px-3 py-1.5 hover:bg-white/10 sm:block">
            Come si gioca
          </Link>
          <Link href="/leaderboard" className="hidden rounded-full px-3 py-1.5 hover:bg-white/10 sm:block">
            Classifiche
          </Link>
          {user ? (
            <>
              <Link href="/lobby" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                Gioca
              </Link>
              <Link href="/profile" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                Profilo
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                Accedi
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-yellow px-4 py-1.5 font-semibold text-brand-ink hover:bg-brand-yellow-dark"
              >
                Registrati
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
