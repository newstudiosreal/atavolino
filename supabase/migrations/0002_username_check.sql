-- ============================================================================
-- Funzione di utilità: verifica disponibilità username in fase di
-- registrazione, quando l'utente non è ancora autenticato (quindi non può
-- interrogare direttamente public.profiles, protetta da RLS "to authenticated").
-- security definer: espone SOLO un booleano, nessun dato sensibile.
-- ============================================================================

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(candidate)
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
