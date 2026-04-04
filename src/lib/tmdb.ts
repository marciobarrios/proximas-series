import "server-only";
import { TMDB_BASE_URL } from "./constants";
import type { TMDBSearchResponse, TMDBShowDetail, TMDBTrendingResponse } from "./types";

const API_KEY = process.env.TMDB_API_KEY!;

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "es-ES");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function searchShows(query: string): Promise<TMDBSearchResponse> {
  return tmdbFetch<TMDBSearchResponse>("/search/tv", { query });
}

export async function getTrending(): Promise<TMDBTrendingResponse> {
  return tmdbFetch<TMDBTrendingResponse>("/trending/tv/week");
}

export async function getShowDetail(id: number): Promise<TMDBShowDetail> {
  return tmdbFetch<TMDBShowDetail>(`/tv/${id}`, {
    append_to_response: "credits",
  });
}
