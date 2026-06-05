import "server-only";
import { getShowDetail } from "@/lib/tmdb";
import type { UpcomingRelease, WatchlistItem } from "@/lib/types";

const UPCOMING_WINDOW_DAYS = 28;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildEpisodeLabel(seasonNumber: number, episodeNumber: number) {
  if (episodeNumber === 1) {
    return `T${seasonNumber} estreno`;
  }

  return `T${seasonNumber} E${episodeNumber}`;
}

export async function getUpcomingReleases(
  watchlist: WatchlistItem[],
  today = new Date()
): Promise<UpcomingRelease[]> {
  const todayKey = toDateKey(today);
  const windowEndKey = toDateKey(addDays(today, UPCOMING_WINDOW_DAYS));

  const releases = await Promise.all(
    watchlist.map(async (item) => {
      try {
        const show = await getShowDetail(item.tmdb_id);
        const episode = show.next_episode_to_air;

        if (!episode?.air_date) return null;
        if (episode.air_date < todayKey || episode.air_date > windowEndKey) {
          return null;
        }

        return {
          tmdb_id: item.tmdb_id,
          title: item.title || show.name,
          poster_path: item.poster_path ?? show.poster_path,
          air_date: episode.air_date,
          episode_name: episode.name || null,
          season_number: episode.season_number,
          episode_number: episode.episode_number,
          label: buildEpisodeLabel(
            episode.season_number,
            episode.episode_number
          ),
          is_season_premiere: episode.episode_number === 1,
        } satisfies UpcomingRelease;
      } catch {
        return null;
      }
    })
  );

  return releases
    .filter((release): release is UpcomingRelease => release !== null)
    .sort((a, b) => a.air_date.localeCompare(b.air_date));
}
