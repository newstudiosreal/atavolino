# aTavolino

**aTavolino** è un gioco di carte multiplayer online — un tavolo virtuale dove sedersi con gli amici e giocare in tempo reale, dal browser, su PC o smartphone.

> "Il gioco di carte dove il tavolo è sempre aperto."

Sviluppato da **NeW Studios**.

---

## Indice

1. [Cos'è aTavolino](#cosè-atavolino)
2. [Stack tecnologico](#stack-tecnologico)
3. [Architettura](#architettura)
4. [Regole del gioco](#regole-del-gioco)
5. [Struttura del progetto](#struttura-del-progetto)
6. [Configurazione Supabase](#configurazione-supabase)
7. [Variabili d'ambiente](#variabili-dambiente)
8. [Avvio in locale](#avvio-in-locale)
9. [Deploy su Vercel](#deploy-su-vercel)
10. [Sicurezza](#sicurezza)
11. [Sistema multiplayer / realtime](#sistema-multiplayer--realtime)
12. [Testing manuale consigliato](#testing-manuale-consigliato)
13. [Limiti noti della v1.0](#limiti-noti-della-v10)

---

## Cos'è aTavolino

Un gioco di carte "uno contro tutti" con carte numeriche colorate e carte speciali originali (Scambio, Caos, Passa, Jolly, Tavolino, Blocco). Regole, nomi e distribuzione del mazzo sono originali e documentati nel codice — **aTavolino non copia UNO**, nè il suo design, nè i suoi testi.

Il giocatore può registrarsi, creare un tavolo (con codice condivisibile), invitare amici, giocare in tempo reale, e alla fine vedere classifica finale e statistiche personali aggiornate.

## Stack tecnologico

- **Next.js 14** (App Router) + **TypeScript strict** + **React 18**
- **Tailwind CSS** per lo stile
- **Framer Motion** per le animazioni leggere
- **Supabase**: PostgreSQL, Auth, Realtime
- **Vercel** per l'hosting
- **GitHub** per il repository

## Architettura

```
Browser (React) ── Supabase Realtime (WebSocket) ── Postgres
      │
      ├── Server Actions (Next.js) ── Service Role Key ── Postgres
      │      (creazione partite, join, avvio, giocate, pesca:
      │       tutta la logica di gioco è validata QUI, mai sul client)
      │
      └── Client Supabase (anon key) ── rispetta la Row Level Security
             (lettura profili, lettura partita/giocatori propri, ecc.)
```

Principio chiave: **il client non decide mai l'esito di una mossa**. Ogni azione di gioco (giocare una carta, pescare, avviare la partita, dichiarare un vincitore, aggiornare le statistiche) passa da una Server Action che usa la Service Role Key per rileggere lo stato reale dal database, validarlo con il motore di gioco (`src/lib/game/engine.ts`), e scrivere il nuovo stato. Il client propone, il server dispone.

La UI si aggiorna in tempo reale tramite Supabase Realtime: ogni client è iscritto ai cambiamenti di `games`, `game_players`, `game_moves` e `game_results` per la partita a cui partecipa, e ri-legge i dati (rispettando la RLS) quando arriva un evento.

## Regole del gioco

Il regolamento completo, con la distribuzione originale del mazzo (112 carte) e il funzionamento di ogni carta speciale, è documentato:

- in linguaggio naturale nella pagina **"Come si gioca"** dell'app (`/regole`);
- nel dettaglio tecnico nei commenti di `src/lib/game/engine.ts` e `src/constants/cards.ts`.

Riassunto:

- Ogni giocatore parte con 7 carte.
- Al proprio turno: gioca una carta valida (stesso colore o stesso valore/tipo della cima dello scarto) oppure pesca.
- **Scambio** 🔄 — scambia una carta casuale con un avversario a scelta.
- **Caos** 🎲 — effetto casuale tra 4 possibilità.
- **Passa** ➡️ — passa una tua carta al giocatore successivo.
- **Jolly** 🃏 — scegli il colore attivo.
- **Tavolino** 💥 — tutti passano una carta casuale al giocatore successivo, in contemporanea.
- **Blocco** 🛡️ — ti protegge dal prossimo Scambio/Passa/Caos diretto contro di te.
- Vince chi resta per primo senza carte; gli altri sono classificati per numero di carte rimaste.

## Struttura del progetto

```
src/
├── app/                    # Route Next.js (App Router)
│   ├── page.tsx            # Homepage
│   ├── login/ register/ recupero-password/
│   ├── lobby/               # Ingresso lobby + /lobby/tavolo/[code]
│   ├── game/[code]/         # Tavolo di gioco + /risultati
│   ├── profile/ leaderboard/ regole/
│   └── auth/callback/       # Redirect conferma email / reset password
├── components/
│   ├── ui/                 # Button, Input, Panel, Toaster
│   ├── cards/               # PlayingCard, Hand
│   ├── lobby/               # Form crea/unisciti, lista giocatori, LobbyRoom
│   ├── game/                 # GameClient, PlayerSeat, ColorPicker, ecc.
│   └── layout/               # Navbar, Footer, AuthForm
├── lib/
│   ├── supabase/            # client.ts (browser), server.ts (SSR), admin.ts (service role)
│   ├── game/                # engine.ts (regole), loaders.ts (letture), 
│   ├── actions/              # Server Actions: auth.ts, games.ts, moves.ts
│   └── utils/                 # errors.ts, code.ts
├── hooks/                   # useAuth, useRealtimeGame, useToast
├── types/                   # game.ts (dominio), database.ts (schema Supabase)
├── constants/               # cards.ts (composizione mazzo, documentata)
└── styles/globals.css

supabase/
└── migrations/
    ├── 0001_init.sql         # schema, RLS, trigger, vista pubblica
    └── 0002_username_check.sql
```

## Configurazione Supabase

1. Crea un progetto su [supabase.com](https://supabase.com).
2. Vai su **SQL Editor** ed esegui, in ordine, i file:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_username_check.sql`

   In alternativa, con la [Supabase CLI](https://supabase.com/docs/guides/cli) collegata al progetto:

   ```bash
   supabase link --project-ref <il-tuo-project-ref>
   supabase db push
   ```

3. Vai su **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ segreta, solo server)
4. Vai su **Authentication → URL Configuration** e imposta:
   - Site URL: `http://localhost:3000` in sviluppo, il tuo dominio Vercel in produzione
   - Redirect URLs: aggiungi `http://localhost:3000/auth/callback` e `https://<tuo-dominio>/auth/callback`
5. (Opzionale ma consigliato) In **Authentication → Providers → Email**, decidi se richiedere la conferma email prima del login.

Non è richiesta nessuna configurazione manuale aggiuntiva delle tabelle: la migration crea tutto (tabelle, indici, foreign key, RLS, policy, trigger, funzioni, vista pubblica, pubblicazione realtime).

## Variabili d'ambiente

Copia `.env.example` in `.env.local` e compila:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

⚠️ **`SUPABASE_SERVICE_ROLE_KEY` non deve mai avere il prefisso `NEXT_PUBLIC_` e non deve mai essere importata in un componente client.** Viene usata solo in `src/lib/supabase/admin.ts`, protetto dall'import `"server-only"`.

## Avvio in locale

Requisiti: Node.js 18+.

```bash
npm install
cp .env.example .env.local   # poi compila con le tue chiavi Supabase
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`.

Comandi utili:

```bash
npm run build       # build di produzione
npm run start       # avvia la build di produzione
npm run lint        # ESLint
npm run typecheck   # TypeScript strict, senza emettere file
```

## Deploy su Vercel

1. Crea un repository GitHub e pusha il progetto (vedi sotto).
2. Su [vercel.com](https://vercel.com), importa il repository.
3. Framework preset: **Next.js** (rilevato automaticamente).
4. In **Environment Variables**, aggiungi le stesse quattro variabili di `.env.local` (con `NEXT_PUBLIC_SITE_URL` uguale al dominio Vercel assegnato, es. `https://atavolino.vercel.app`).
5. Deploy.
6. Torna su Supabase → Authentication → URL Configuration e aggiungi l'URL di produzione tra i redirect consentiti (`https://<tuo-dominio>/auth/callback`).
7. (Opzionale) Collega un dominio personalizzato da Vercel → Settings → Domains, poi ripeti il passo 6 con il nuovo dominio.

### Comandi Git suggeriti

```bash
git init
git add .
git commit -m "feat: aTavolino v1.0 - setup iniziale del progetto"
git branch -M main
git remote add origin https://github.com/<tuo-utente>/atavolino.git
git push -u origin main
```

## Sicurezza

- **Row Level Security** attiva su tutte le tabelle di gioco.
- Un giocatore può leggere **solo la propria mano** (`game_players`, RLS `user_id = auth.uid()`); gli altri giocatori del tavolo sono visibili tramite la vista pubblica `game_players_public`, che espone il numero di carte ma **mai** il contenuto della mano.
- **Nessuna scrittura diretta dal client** su `games`, `game_players`, `game_moves`, `game_results`: le policy di insert/update per gli utenti autenticati sono esplicitamente negate. Tutte le mutazioni passano dalle Server Actions con la Service Role Key, dopo validazione con il motore di gioco.
- Un trigger sul database (`prevent_stats_tampering`) impedisce che le statistiche di un profilo vengano modificate da chiunque non sia il ruolo di servizio, anche in caso di bug futuri nel codice applicativo.
- La Service Role Key non è mai esposta al browser (protetta anche a livello di build dall'import `"server-only"`).

## Sistema multiplayer / realtime

- Ogni client sottoscrive un canale Supabase Realtime per il proprio tavolo (`src/hooks/useRealtimeGame.ts`), ricevendo eventi su `games`, `game_players`, `game_moves`, `game_results`.
- Alla ricezione di un evento, il client ri-legge lo stato (rispettando la RLS) tramite `src/lib/game/loaders.ts`.
- Il refresh di pagina è gestito naturalmente: lo stato iniziale viene ricaricato dal Server Component, poi la sottoscrizione realtime riprende.
- Un giocatore che abbandona (o chiude la scheda) viene marcato come disconnesso (`is_connected = false`) tramite `setConnectionStatusAction`; se l'host abbandona, l'host viene riassegnato automaticamente al giocatore con seat più basso rimasto.

## Testing manuale consigliato

- **Autenticazione**: registrazione, conferma email, login, logout, refresh pagina (sessione persiste), recupero password.
- **Lobby**: crea partita, unisciti con codice, verifica che la lista giocatori si aggiorni in tempo reale su una seconda scheda/browser, avvio partita solo da host, blocco avvio con meno di 2 giocatori.
- **Gameplay**: apri 2–4 schede/browser diverse autenticate come utenti diversi, gioca un'intera partita verificando turni, carte speciali (una per una), pesca, vittoria, classifica finale, aggiornamento statistiche/profilo.
- **Sicurezza**: prova a chiamare le Server Actions con un `cardId` non presente nella propria mano, o fuori dal proprio turno: deve restituire un messaggio d'errore in italiano, senza modificare lo stato.
- **Mobile**: ridimensiona la finestra o usa gli strumenti sviluppatore in modalità responsive; la mano deve scorrere orizzontalmente e restare leggibile.

## Limiti noti della v1.0

- Non c'è ancora un sistema di chat in partita.
- Non c'è ricongiungimento automatico dei posti se un giocatore abbandona a metà partita (il gioco continua con i giocatori restanti).
- La classifica globale non ha paginazione (limite di 50 giocatori mostrati).
- Non è prevista la modalità "torneo" o partite a squadre: sono idee per versioni future.

---

Un gioco di **NeW Studios**. Buona partita! 🎴
