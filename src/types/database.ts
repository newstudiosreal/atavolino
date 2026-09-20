// ============================================================================
// Tipi generati "a mano" per lo schema Supabase (public schema), nella forma
// esatta richiesta da @supabase/supabase-js (GenericTable/GenericView, con
// il campo Relationships). In un progetto reale questi vengono rigenerati
// con:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// Sono comunque tenuti allineati a supabase/migrations/0001_init.sql.
// ============================================================================

export type GameStatusDb = "lobby" | "in_corso" | "terminata";
export type CardColorDb = "rosso" | "blu" | "verde" | "giallo";

export type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  games_played: number;
  games_won: number;
  games_lost: number;
  created_at: string;
  updated_at: string;
};

export type GameRow = {
  id: string;
  code: string;
  name: string | null;
  host_id: string;
  status: GameStatusDb;
  is_public: boolean;
  max_players: number;
  current_turn_user_id: string | null;
  active_color: CardColorDb | null;
  deck_state: unknown;
  discard_pile: unknown;
  turn_direction: number;
  pending_effect: unknown;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
};

export type GamePlayerRow = {
  id: string;
  game_id: string;
  user_id: string;
  seat: number;
  hand: unknown;
  is_ready: boolean;
  is_host: boolean;
  is_connected: boolean;
  shield: boolean;
  left_at: string | null;
  joined_at: string;
};

export type GamePlayerPublicRow = {
  id: string;
  game_id: string;
  user_id: string;
  seat: number;
  is_ready: boolean;
  is_host: boolean;
  is_connected: boolean;
  shield: boolean;
  joined_at: string;
  card_count: number;
};

export type GameMoveRow = {
  id: string;
  game_id: string;
  user_id: string | null;
  action: string;
  card: unknown;
  target_user_id: string | null;
  payload: unknown;
  created_at: string;
};

export type GameResultRowDb = {
  id: string;
  game_id: string;
  user_id: string;
  position: number;
  cards_left: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: { id: string; username: string; avatar_url?: string | null };
        Update: {
          username?: string;
          avatar_url?: string | null;
          // Scrivibili SOLO dal service role (bypassa RLS), mai dal client:
          // il trigger prevent_stats_tampering le protegge comunque a livello DB.
          games_played?: number;
          games_won?: number;
          games_lost?: number;
        };
        Relationships: [];
      };
      games: {
        Row: GameRow;
        Insert: {
          code: string;
          host_id: string;
          max_players: number;
          name?: string | null;
          status?: GameStatusDb;
          is_public?: boolean;
          current_turn_user_id?: string | null;
          active_color?: CardColorDb | null;
          deck_state?: unknown;
          discard_pile?: unknown;
          turn_direction?: number;
          pending_effect?: unknown;
          started_at?: string | null;
          ended_at?: string | null;
        };
        Update: {
          name?: string | null;
          status?: GameStatusDb;
          is_public?: boolean;
          host_id?: string;
          max_players?: number;
          current_turn_user_id?: string | null;
          active_color?: CardColorDb | null;
          deck_state?: unknown;
          discard_pile?: unknown;
          turn_direction?: number;
          pending_effect?: unknown;
          started_at?: string | null;
          ended_at?: string | null;
        };
        Relationships: [];
      };
      game_players: {
        Row: GamePlayerRow;
        Insert: {
          game_id: string;
          user_id: string;
          seat: number;
          hand?: unknown;
          is_ready?: boolean;
          is_host?: boolean;
          is_connected?: boolean;
          shield?: boolean;
          left_at?: string | null;
        };
        Update: {
          hand?: unknown;
          is_ready?: boolean;
          is_host?: boolean;
          is_connected?: boolean;
          shield?: boolean;
          left_at?: string | null;
          seat?: number;
        };
        Relationships: [];
      };
      game_moves: {
        Row: GameMoveRow;
        Insert: {
          game_id: string;
          action: string;
          user_id?: string | null;
          card?: unknown;
          target_user_id?: string | null;
          payload?: unknown;
        };
        Update: {
          action?: string;
          card?: unknown;
          target_user_id?: string | null;
          payload?: unknown;
        };
        Relationships: [];
      };
      game_results: {
        Row: GameResultRowDb;
        Insert: {
          game_id: string;
          user_id: string;
          position: number;
          cards_left?: number;
        };
        Update: {
          position?: number;
          cards_left?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      game_players_public: {
        Row: GamePlayerPublicRow;
        Relationships: [];
      };
    };
    Functions: {
      is_username_available: {
        Args: { candidate: string };
        Returns: boolean;
      };
    };
  };
};
