export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function tmdbImage(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdrop(
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getYear(dateString: string | null | undefined): string {
  if (!dateString) return "";
  return dateString.split("-")[0];
}

export function getYearRange(
  firstAirDate: string | null | undefined,
  lastAirDate: string | null | undefined,
  status: string | undefined
): string {
  const start = getYear(firstAirDate);
  if (!start) return "";
  if (status === "Returning Series") return `${start}–`;
  const end = getYear(lastAirDate);
  if (end && end !== start) return `${start}–${end}`;
  return start;
}
