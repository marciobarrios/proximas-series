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
  tagline: string;
  last_air_date: string;
  genres: { id: number; name: string }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  credits?: {
    cast: TMDBCastMember[];
  };
  recommendations?: { page: number; results: TMDBShow[] };
  similar?: { page: number; results: TMDBShow[] };
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
  seen: boolean;
  added_at: string;
  seen_at: string | null;
}
