# Próximas series

A personal TV show tracker to browse trending shows, search the TMDB catalog, and manage a watchlist by viewing status.

## Tech Stack

- **Framework** — Next.js 16 with React 19 and TypeScript
- **Database & Auth** — Supabase (PostgreSQL + OAuth)
- **TV Data** — TMDB API
- **Styling** — Tailwind CSS 4 + Shadcn/ui
- **Data Fetching** — SWR for client-side caching, Server Actions for mutations
- **Package Manager** — pnpm

## Features

- Browse weekly trending TV shows
- Search shows with a command palette (⌘K)
- View show details — genres, cast, networks, seasons, ratings
- Add/remove shows from your personal watchlist
- Mark shows as pending, watching, waiting for the next season, or seen with optimistic UI updates
- Filter your watchlist by status
- OAuth authentication via Supabase

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A [Supabase](https://supabase.com) project
- A [TMDB API key](https://developer.themoviedb.org)

### Environment Variables

Create a `.env.local` file with:

```
TMDB_API_KEY=<your-tmdb-api-key>
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
OWNER_USER_ID=<your-existing-supabase-auth-user-uuid>
```

### Database Setup

Create the following tables in your Supabase project:

**`watchlist`** — `id`, `user_id`, `tmdb_id`, `title`, `poster_path`, `overview`, `first_air_date`, `vote_average`, `number_of_seasons`, `status` (`pending`, `watching`, `waiting`, or `seen`), `added_at`, `seen_at`

**`profiles`** — `id`, `display_name`, `avatar_url`

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Owner-only access

The app is private. Configure **server-only** `OWNER_USER_ID` with the UUID of
its existing owner in Supabase Authentication → Users. Do not use an email,
`user_metadata`, a public environment variable, or a service-role key. Missing
or malformed configuration denies all application access (503). Google OAuth
is retained; signing in with any other account does not grant access.

`/login`, the OAuth callback, framework assets, favicon and robots are public.
All catalog pages, metadata, APIs and watchlist actions require verified Supabase
claims whose `sub` equals the owner UUID. Anonymous requests are rejected before
Supabase/TMDB calls. Server entry points also authorize independently of Proxy.
HTML and API responses use private/no-store policies; there is no public HTML
ISR. Compact TMDB detail/season/trending data remains cached for 24 hours and
shared by authorized requests. Searches do not persist per-query cache entries.
Internal links still disable speculative prefetching and robots disallow crawling.

### Before reactivating the paused project

1. Confirm the existing owner's Auth UUID and set `OWNER_USER_ID` in each intended
   environment. Keep both projects paused until the access controls are ready.
2. Review Supabase's **actual** RLS policies for `watchlist` and `profiles`.
   Browser clients access Supabase directly, so application guards alone do not
   restrict the database API. Apply `scripts/owner-only-rls.sql` with the **same**
   owner UUID after verifying the table names and existing owner-row policies.
   This adds restrictive policies; it preserves existing row isolation and data.
   Also disable new user signup in Auth while preserving the existing owner.
3. Test the preview with the owner and another account. Verify direct REST access
   to both tables with the other account is denied; test owner CRUD and logout.
   The SQL has not been applied or validated against the paused database.
4. Deploy the reviewed change, then resume only when these checks pass. Previous
   cached/public deployments must not remain accessible through aliases or old
   deployment URLs: verify Deployment Protection or remove their public access.
   Do not reactivate the previous production build.

The application permits a valid owner JWT until it expires; revoking a session
is not an instantaneous invalidation of already-issued tokens. Changing the
owner UUID denies the old UUID on its next request. No credentials, auth settings,
RLS policies or deployment settings are changed automatically by this PR.

### Verification

`pnpm test:resources` builds production and runs on port 3107 with fake TMDB,
Supabase and font boundaries. It checks real JWT signature verification, owner
access, rejection of other/anonymous/forged sessions, HTML/HEAD/RSC/API denial,
missing owner configuration, no public caching and compact persisted TMDB data.
It recreates/removes `.next`; stop local dev servers first. No real credentials
or production requests are required. `pnpm test:cache` is now an anonymous denial
smoke check; optionally pass `BASE_URL` for a reviewed preview. It must fail
against a paused project or a Vercel login page; neither proves application auth.

After activation compare dated, equal traffic windows for ISR writes, CPU,
function invocations and origin transfer. A rejected request can still invoke
Proxy, but cannot populate show/data caches. Existing rolling usage does not
reset when deploying or pausing; no exact savings percentage is assumed.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home — trending shows
│   ├── mis-series/           # Watchlist page with filters
│   ├── serie/[id]/           # Show detail page
│   ├── actions/              # Server actions (watchlist mutations)
│   └── api/tmdb/             # TMDB proxy routes (search, trending, show details)
├── components/
│   ├── auth/                 # Login button, user menu
│   ├── layout/               # Header, search bar
│   ├── shows/                # Show card, grid, skeleton
│   ├── watchlist/            # Watchlist card, grid, empty state
│   └── ui/                   # Shadcn/ui primitives
├── hooks/                    # useSession, useSearch
└── lib/                      # Auth helpers, TMDB client, Supabase clients, types
```
