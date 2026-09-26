import type {
  TMDBEpisode, TMDBSeason, TMDBSeasonDetail, TMDBShow, TMDBShowDetail,
} from "./types";

function pick<T, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, value[key]])) as Pick<T, K>;
}

export function compactShow(show: TMDBShow | TMDBShowDetail): TMDBShow {
  return {
    ...pick(show, ["id", "name", "overview", "poster_path", "backdrop_path",
      "first_air_date", "vote_average", "vote_count", "popularity",
      "origin_country", "original_language", "original_name"]),
    genre_ids: "genre_ids" in show ? show.genre_ids : show.genres.map((g) => g.id),
  };
}

export function compactEpisode(episode: TMDBEpisode): TMDBEpisode {
  return pick(episode, ["id", "name", "overview", "air_date", "episode_number",
    "episode_type", "runtime", "season_number", "show_id", "still_path",
    "vote_average", "vote_count"]);
}

function compactSeason(season: TMDBSeason): TMDBSeason {
  return pick(season, ["id", "name", "overview", "air_date", "episode_count",
    "poster_path", "season_number", "vote_average"]);
}

// Cache the app's bounded view of TMDB, not unbounded credits/crew/guest stars.
// Project explicitly: spreading the raw response retains undeclared fields too.
export function compactShowDetail(show: TMDBShowDetail): TMDBShowDetail {
  return {
    ...compactShow(show),
    ...pick(show, ["number_of_seasons", "number_of_episodes", "status",
      "in_production", "tagline", "last_air_date"]),
    next_episode_to_air: show.next_episode_to_air && compactEpisode(show.next_episode_to_air),
    last_episode_to_air: show.last_episode_to_air && compactEpisode(show.last_episode_to_air),
    seasons: show.seasons.map(compactSeason),
    genres: show.genres.map((g) => pick(g, ["id", "name"])),
    networks: show.networks.map((n) => pick(n, ["id", "name", "logo_path"])),
    created_by: show.created_by.map((c) => pick(c, ["id", "name", "profile_path"])),
    credits: { cast: (show.credits?.cast ?? []).slice(0, 8).map((c) =>
      pick(c, ["id", "name", "character", "profile_path", "order"])) },
    recommendations: { page: 1, results: (show.recommendations?.results ?? []).slice(0, 10).map(compactShow) },
    similar: { page: 1, results: (show.similar?.results ?? []).slice(0, 10).map(compactShow) },
  };
}

export function compactSeasonDetail(season: TMDBSeasonDetail): TMDBSeasonDetail {
  return { ...compactSeason(season), episodes: season.episodes.map(compactEpisode) };
}
