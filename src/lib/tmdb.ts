import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TMDB_BASE_URL } from "./constants";
import { TMDB_REVALIDATE_SECONDS } from "./cache-policy";
import { compactEpisode, compactSeasonDetail, compactShow, compactShowDetail } from "./tmdb-payload";
import type {
  TMDBSearchResponse,
  TMDBSeasonDetail,
  TMDBShowDetail,
  TMDBShowRelease,
  TMDBTrendingResponse,
} from "./types";

const API_KEY = process.env.TMDB_API_KEY!;

export class TMDBError extends Error {
  constructor(public readonly status: number) {
    super(`TMDB API error: ${status}`);
  }
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "es-ES");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    // Persist only the projected result in unstable_cache below. Caching this
    // raw response as well doubles entries and stores unused provider data.
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new TMDBError(res.status);
  }
  return res.json() as Promise<T>;
}

export async function searchShows(query: string): Promise<TMDBSearchResponse> {
  const data = await tmdbFetch<TMDBSearchResponse>("/search/tv", { query });
  return { ...data, results: data.results.map(compactShow) };
}

// This app uses the pre-Cache-Components ISR model. unstable_cache keeps the
// projection server-side and persisted without migrating the whole router.
export const getTrending = unstable_cache(async (): Promise<TMDBTrendingResponse> => {
  const data = await tmdbFetch<TMDBTrendingResponse>("/trending/tv/week");
  return { page: data.page, results: data.results.slice(0, 20).map(compactShow) };
}, ["tmdb-trending-es-v1"], { revalidate: TMDB_REVALIDATE_SECONDS });

export const getShowDetail = cache(
  unstable_cache(async (id: number): Promise<TMDBShowDetail> => {
    const data = await tmdbFetch<TMDBShowDetail>(
      `/tv/${id}`,
      {
        append_to_response: "credits,recommendations,similar",
      }
    );
    return compactShowDetail(data);
  }, ["tmdb-detail-es-v1"], { revalidate: TMDB_REVALIDATE_SECONDS })
);

export const getShowRelease = cache(
  unstable_cache(async (id: number): Promise<TMDBShowRelease> => {
    const show = await tmdbFetch<TMDBShowRelease>(`/tv/${id}`);
    return {
      name: show.name,
      poster_path: show.poster_path,
      next_episode_to_air: show.next_episode_to_air && compactEpisode(show.next_episode_to_air),
    };
  }, ["tmdb-release-es-v1"], { revalidate: TMDB_REVALIDATE_SECONDS })
);

export const getSeasonDetail = cache(
  unstable_cache(async (showId: number, seasonNumber: number): Promise<TMDBSeasonDetail> => {
    const data = await tmdbFetch<TMDBSeasonDetail>(`/tv/${showId}/season/${seasonNumber}`);
    return compactSeasonDetail(data);
  }, ["tmdb-season-es-v1"], { revalidate: TMDB_REVALIDATE_SECONDS })
);
