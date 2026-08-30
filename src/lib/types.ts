// TMDB API response types

export interface TMDBShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
}

export interface TMDBShowDetail extends Omit<TMDBShow, "genre_ids"> {
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  in_production: boolean;
  tagline: string;
  last_air_date: string;
  next_episode_to_air: TMDBEpisode | null;
  last_episode_to_air: TMDBEpisode | null;
  seasons: TMDBSeason[];
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  credits?: {
    cast: TMDBCastMember[];
  };
  recommendations?: { page: number; results: TMDBShow[] };
  similar?: { page: number; results: TMDBShow[] };
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_number: number;
  episode_type?: string;
  runtime?: number | null;
  season_number: number;
  show_id?: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  air_date: string | null;
  episode_count: number;
  poster_path: string | null;
  season_number: number;
  vote_average?: number;
}

export interface TMDBSeasonDetail extends TMDBSeason {
  episodes: TMDBEpisode[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBShow[];
  total_pages: number;
  total_results: number;
}

export interface TMDBTrendingResponse {
  page: number;
  results: TMDBShow[];
}

// App types

export const WATCHLIST_STATUSES = [
  "pending",
  "watching",
  "waiting",
  "seen",
] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

export function isWatchlistStatus(value: unknown): value is WatchlistStatus {
  return (
    typeof value === "string" &&
    WATCHLIST_STATUSES.some((status) => status === value)
  );
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  overview: string | null;
  first_air_date: string | null;
  vote_average: number | null;
  number_of_seasons: number | null;
  status: WatchlistStatus;
  added_at: string;
  seen_at: string | null;
}

export interface UpcomingRelease {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  air_date: string;
  episode_name: string | null;
  season_number: number;
  episode_number: number;
  label: string;
  is_season_premiere: boolean;
}
