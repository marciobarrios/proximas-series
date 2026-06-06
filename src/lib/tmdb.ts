import "server-only";
import { cache } from "react";
import { TMDB_BASE_URL } from "./constants";
import type {
  TMDBSearchResponse,
  TMDBSeasonDetail,
  TMDBShowDetail,
  TMDBTrendingResponse,
} from "./types";

const API_KEY = process.env.TMDB_API_KEY!;
const SHOW_DETAIL_REVALIDATE_SECONDS = 60 * 60 * 6;

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  options: { revalidate?: number } = {}
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "es-ES");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    next:
      options.revalidate === undefined
        ? undefined
        : { revalidate: options.revalidate },
  });
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchShows(query: string): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>("/search/tv", { query });
}

export async function getTrending(): Promise<TMDBTrendingResponse> {
  return tmdbFetch<TMDBTrendingResponse>(
    "/trending/tv/week",
    {},
    { revalidate: 60 * 60 }
  );
}

export const getShowDetail = cache(
  async (id: number): Promise<TMDBShowDetail> => {
    return tmdbFetch<TMDBShowDetail>(
      `/tv/${id}`,
      {
        append_to_response: "credits,recommendations,similar",
      },
      {
        revalidate: SHOW_DETAIL_REVALIDATE_SECONDS,
      }
    );
  }
);

export const getSeasonDetail = cache(
  async (showId: number, seasonNumber: number): Promise<TMDBSeasonDetail> => {
    return tmdbFetch<TMDBSeasonDetail>(
      `/tv/${showId}/season/${seasonNumber}`,
      {},
      {
        revalidate: SHOW_DETAIL_REVALIDATE_SECONDS,
      }
    );
  }
);
