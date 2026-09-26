// Keep the literal revalidate export in /serie/[id]/page.tsx in sync.
// Next.js must be able to statically analyze route segment configuration.
export const TMDB_REVALIDATE_SECONDS = 86400;
export const PUBLIC_TMDB_CACHE_CONTROL =
  `public, max-age=300, s-maxage=${TMDB_REVALIDATE_SECONDS}, stale-while-revalidate=3600`;
export const SEARCH_CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=3600";
