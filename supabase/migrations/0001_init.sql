-- ============================================================================
-- aTavolino - schema iniziale
-- ============================================================================
-- Principi di sicurezza:
-- 1) RLS attiva su tutte le tabelle di gioco.
-- 2) I client (chiave anon / utenti autenticati) possono SOLO:
--      - leggere il proprio profilo e i profili pubblici (per leaderboard)
--      - leggere le partite/giocatori a cui partecipano (senza vedere le
--        mani altrui: la colonna "hand" è leggibile solo dal proprietario)
--      - inserire la propria riga in game_players quando entrano in un tavolo
--        (tramite RPC controllata, non un insert libero)
--      - leggere i risultati (pubblici, per la classifica)
-- 3) Tutte le mutazioni "di gioco" (creare partita, avviare, giocare una
--    carta, pescare, applicare effetti, dichiarare il vincitore, aggiornare
--    le statistiche) avvengono ESCLUSIVAMENTE lato server, tramite le
--    Server Actions di Next.js che usano la Service Role Key (che bypassa
--    RLS). Le policy sotto quindi negano quasi tutte le scritture dirette
--    da parte del client: è una difesa in profondità, il vero motore di
--    gioco vive nel server.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  games_played integer not null default 0,
  games_won integer not null default 0,
  games_lost integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint username_length check (char_length(username) between 3 and 20),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Chiunque autenticato può leggere i profili pubblici (serve per leaderboard,
-- nomi in lobby, avatar in partita).
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- L'utente può creare solo il proprio profilo (chiamato dal trigger comunque,
-- ma la policy resta come difesa in profondità).
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- L'utente può aggiornare solo username/avatar del proprio profilo.
-- Le statistiche sono protette dal trigger prevent_stats_tampering (sotto),
-- che le ripristina se chi scrive non è il ruolo di servizio.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.prevent_stats_tampering()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Se chi esegue l'update non è il service role, le statistiche non
  -- possono cambiare: vengono forzate al valore precedente.
  if auth.role() is distinct from 'service_role' then
    new.games_played := old.games_played;
    new.games_won := old.games_won;
    new.games_lost := old.games_lost;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_stats_tampering on public.profiles;
create trigger trg_prevent_stats_tampering
  before update on public.profiles
  for each row execute function public.prevent_stats_tampering();

-- Crea automaticamente un profilo alla registrazione (username preso dai
-- metadata passati da Supabase Auth in fase di sign up).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'giocatore_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- GAMES
-- ----------------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  host_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'in_corso', 'terminata')),
  is_public boolean not null default false,
  max_players integer not null check (max_players between 2 and 8),
  current_turn_user_id uuid references public.profiles (id),
  active_color text check (active_color in ('rosso', 'blu', 'verde', 'giallo')),
  deck_state jsonb not null default '[]'::jsonb,
  discard_pile jsonb not null default '[]'::jsonb,
  turn_direction integer not null default 1,
  pending_effect jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz
);

create index if not exists games_code_idx on public.games (code);
create index if not exists games_status_idx on public.games (status);

alter table public.games enable row level security;

-- Un utente può leggere una partita se: ne fa parte, oppure è pubblica ed è
-- ancora in lobby (per poterla scoprire/joinare).
create policy "games_select_participant_or_public_lobby"
  on public.games for select
  to authenticated
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.game_players gp
      where gp.game_id = games.id and gp.user_id = auth.uid()
    )
    or (is_public = true and status = 'lobby')
  );

-- Nessun insert/update/delete diretto dal client: tutto passa dalle Server
-- Actions con service role. (Nessuna policy = accesso negato di default,
-- ma lo rendiamo esplicito per chiarezza.)
create policy "games_no_direct_write"
  on public.games for insert
  to authenticated
  with check (false);

create policy "games_no_direct_update"
  on public.games for update
  to authenticated
  using (false);

-- ----------------------------------------------------------------------------
-- GAME_PLAYERS
-- ----------------------------------------------------------------------------
create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seat integer not null,
  hand jsonb not null default '[]'::jsonb,
  is_ready boolean not null default true,
  is_host boolean not null default false,
  is_connected boolean not null default true,
  shield boolean not null default false,
  left_at timestamptz,
  joined_at timestamptz not null default now(),

  unique (game_id, user_id),
  unique (game_id, seat)
);

alter table public.game_players enable row level security;

-- Un giocatore vede SOLO la propria riga (che include la propria mano
-- completa). Per vedere gli altri giocatori del tavolo (senza mano) si usa
-- la view pubblica game_players_public definita più sotto.
create policy "game_players_select_own_row"
  on public.game_players for select
  to authenticated
  using (user_id = auth.uid());

create policy "game_players_no_direct_insert"
  on public.game_players for insert
  to authenticated
  with check (false);

create policy "game_players_no_direct_update"
  on public.game_players for update
  to authenticated
  using (false);

-- Vista pubblica (senza colonna hand) per mostrare gli altri giocatori del
-- tavolo, con il conteggio delle carte in mano al posto della mano stessa.
create or replace view public.game_players_public
  with (security_invoker = true)
  as
  select
    gp.id,
    gp.game_id,
    gp.user_id,
    gp.seat,
    gp.is_ready,
    gp.is_host,
    gp.is_connected,
    gp.shield,
    gp.joined_at,
    jsonb_array_length(gp.hand) as card_count
  from public.game_players gp
  where exists (
    select 1 from public.game_players me
    where me.game_id = gp.game_id and me.user_id = auth.uid()
  );

grant select on public.game_players_public to authenticated;

-- ----------------------------------------------------------------------------
-- GAME_MOVES (log delle mosse, usato per il feed eventi realtime / storico)
-- ----------------------------------------------------------------------------
create table if not exists public.game_moves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid references public.profiles (id),
  action text not null check (
    action in ('gioca_carta', 'pesca', 'scambio', 'caos', 'passa_carta', 'jolly', 'tavolino', 'blocco', 'entra', 'esce', 'avvia', 'vince')
  ),
  card jsonb,
  target_user_id uuid references public.profiles (id),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_moves_game_id_idx on public.game_moves (game_id, created_at);

alter table public.game_moves enable row level security;

-- Solo i partecipanti alla partita possono leggere il log mosse (non
-- contiene mani altrui, solo azioni pubbliche).
create policy "game_moves_select_participant"
  on public.game_moves for select
  to authenticated
  using (
    exists (
      select 1 from public.game_players gp
      where gp.game_id = game_moves.game_id and gp.user_id = auth.uid()
    )
  );

create policy "game_moves_no_direct_insert"
  on public.game_moves for insert
  to authenticated
  with check (false);

-- ----------------------------------------------------------------------------
-- GAME_RESULTS
-- ----------------------------------------------------------------------------
create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null check (position >= 1),
  cards_left integer not null default 0,
  created_at timestamptz not null default now(),

  unique (game_id, user_id)
);

create index if not exists game_results_user_id_idx on public.game_results (user_id);

alter table public.game_results enable row level security;

-- Risultati leggibili da tutti gli utenti autenticati (servono per la
-- classifica globale e per lo storico "partite recenti" nel profilo).
create policy "game_results_select_all"
  on public.game_results for select
  to authenticated
  using (true);

create policy "game_results_no_direct_insert"
  on public.game_results for insert
  to authenticated
  with check (false);

-- ----------------------------------------------------------------------------
-- Realtime: abilita le tabelle sui canali di postgres_changes
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_players;
alter publication supabase_realtime add table public.game_moves;
alter publication supabase_realtime add table public.game_results;
