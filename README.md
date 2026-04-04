# Próximas series

A personal TV show tracker to browse trending shows, search the TMDB catalog, and manage a watchlist with seen/pending status.

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
- Mark shows as seen or pending with optimistic UI updates
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
```

### Database Setup

Create the following tables in your Supabase project:

**`watchlist`** — `id`, `user_id`, `tmdb_id`, `title`, `poster_path`, `overview`, `first_air_date`, `vote_average`, `number_of_seasons`, `seen`, `added_at`, `seen_at`

**`profiles`** — `id`, `display_name`, `avatar_url`

### Install & Run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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
