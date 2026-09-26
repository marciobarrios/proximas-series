// Preloaded by test-resource-usage.mjs only. Next's real fetch/data/HTML caches
// remain active; only the external TMDB boundary is replaced.
import { appendFileSync, readFileSync } from "node:fs";
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const originalPerformanceNow = performance.now.bind(performance);
const state = () => JSON.parse(readFileSync(process.env.TMDB_FIXTURE_STATE, "utf8"));
Date.now = () => originalNow() + state().advanceMs;
Object.defineProperty(performance, "now", {
  value: () => originalPerformanceNow() + state().advanceMs,
});
const unused = "UNUSED_TMDB_PAYLOAD".repeat(3000);
const today = new Date().toISOString().slice(0, 10);
const episode = {
  id: 1, name: "Fixture episode", overview: "", air_date: today,
  episode_number: 2, season_number: 1, still_path: null,
  vote_average: 8, vote_count: 1,
};
const show = {
  id: 37636, name: "Cache fixture", overview: "Fixture overview",
  poster_path: null, backdrop_path: null, first_air_date: "2020-01-01",
  last_air_date: today, vote_average: 8, vote_count: 1, genre_ids: [],
  popularity: 1, origin_country: ["ES"], original_language: "es",
  original_name: "Cache fixture", number_of_seasons: 1,
  number_of_episodes: 2, status: "Returning Series", in_production: true,
  tagline: "", next_episode_to_air: episode, last_episode_to_air: episode,
  seasons: [], genres: [], networks: [], created_by: [],
  credits: { cast: [], crew: [{ biography: unused }] },
  recommendations: { page: 1, results: [] }, similar: { page: 1, results: [] },
  unused_provider_field: unused,
};
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === "string" ? input : input.url ?? input);
  if (url.hostname !== "api.themoviedb.org") return originalFetch(input, options);
  appendFileSync(process.env.TMDB_FIXTURE_LOG, `${url.pathname}\n`);
  if (state().fail) return new Response("{}", { status: 503 });
  if (url.pathname === "/3/tv/999999998") return new Response("{}", { status: 503 });
  if (url.pathname === "/3/tv/999999999") return new Response("{}", { status: 404 });
  if (url.pathname.includes("/season/")) {
    return Response.json({ id: 1, name: "Temporada 1", season_number: 1,
      episodes: [{ ...episode, crew: [{ biography: unused }] }],
      overview: "", air_date: today, episode_count: 2, poster_path: null });
  }
  if (url.pathname.startsWith("/3/tv/")) return Response.json(show);
  return Response.json({ page: 1, results: [show], total_pages: 1, total_results: 1 });
};
