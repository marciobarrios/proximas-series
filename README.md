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

## Public-page caching

Show pages (`/serie/[id]`) use on-demand ISR: the first visit generates the
public HTML, then requests share it for 24 hours. TMDB details, seasons, release
lookups, and trending data also refresh after 24 hours. This is request-driven
revalidation, not a scheduled daily job; quiet pages do no regeneration work.
Only the fields and list lengths the app uses are persisted, with no second
cache of the full TMDB response. Episode status badges update their date in the
browser without a server request. Personal watchlist status loads with a
user-specific SWR key and Supabase's existing row-level security. Mutations
still authenticate on the server, refresh the browser's watchlist query, and
invalidate `/mis-series` without evicting public show HTML.

Only `/` and `/mis-series` need the authentication proxy for server rendering.
Keeping it off public show pages also avoids a function invocation on cache hits.

To verify caching, run a production server (`pnpm build` then `pnpm start`) and:

```bash
pnpm test:cache
# Against a deployment, or to select another existing TMDB show:
BASE_URL=https://proximas-series.vercel.app SHOW_ID=37636 pnpm test:cache
```

The check warms a show URL, then requires cache hits for GET, HEAD, a request
with an invalid test-session cookie, an RSC prefetch, and a crawler request.
It also checks that cached responses never set cookies and that RSC requests
receive an RSC payload. `next dev` intentionally bypasses this cache and cannot
pass it.

For a credential-free regression check, run `pnpm test:resources`. It builds
with Webpack, starts a local production server on port 3107 (`TEST_PORT` can
override it), replaces only TMDB and Google Fonts with fixtures, and exercises
the real Next.js caches. It verifies the 24-hour lifetime, cache hits, compact
persisted payloads, shared API/page data, invalid IDs, and stale-page preservation
during a provider outage. **It recreates and removes `.next`**, so stop any local
dev/production server before running it. Fixture builds are removed afterward
to avoid accidentally deploying them. `pnpm build` still uses real providers.

Successful public JSON responses use the CDN: show/trending responses have a
24-hour CDN lifetime, searches one hour, and all three have a five-minute browser
lifetime. Search queries do not create persistent Next.js data-cache entries.
Errors and personalized pages are not given public cache headers. Show API
responses expose the app's compact view (eight cast members and ten items per
recommendation list), rather than the entire provider payload.

The daily interval is configured in `src/lib/cache-policy.ts` and the literal
`revalidate` export in `src/app/serie/[id]/page.tsx`. Keep both synchronized.
To use two days, change both to `172800` and update the regression expectations.
Changing only the page is insufficient: a shorter data cache can lower the page
lifetime. Data freshness is approximate under stale-while-revalidate; the first
request after expiry can see the previous version, and outages retain old data.

### Avoiding speculative work and crawler load

Internal links use `prefetch={false}`: opening a page or scrolling through its
show cards must not fetch other routes. Next.js still navigates on click, using
the existing loading states and shared ISR cache. This trades advance loading
for lower function usage, especially for JavaScript-enabled crawlers that would
otherwise prefetch every visible recommendation and the personal watchlist.

`/robots.txt` asks the background crawlers observed in production logs,
`meta-externalagent`, `SemrushBot`, and `SERankingBacklinksBot`, not to crawl the site. Other crawlers can
still visit public pages; API and personal watchlist URLs are excluded from
crawling. These are advisory crawl rules, not authentication or firewall rules,
and crawlers may take time to refresh them. Search and social-preview crawlers
are not added to the blocked groups.

To verify the resource reduction in a production browser build, open a show
with recommendations, let it hydrate, and scroll through the cards. The Network
panel must show no requests with `Next-Router-Prefetch: 1`. Clicking a show card
must still load that show's details. Do not use `next dev` for this check:
automatic prefetching is only enabled in production.

After deploying, compare `/serie/[id]` function invocations and active CPU in
Vercel Observability over equivalent traffic windows. First visits and daily
revalidations still use compute; existing usage totals are not reset by a deploy.
See [the resource audit](docs/vercel-resource-usage.md) for the production evidence,
remaining costs, and the checks to perform after deployment.

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
