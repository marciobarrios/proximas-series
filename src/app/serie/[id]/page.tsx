import type { Metadata } from "next";
import Image from "next/image";
import { CalendarDays, Clock3 } from "lucide-react";
import { notFound } from "next/navigation";
import { getSeasonDetail, getShowDetail } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";
import { tmdbImage, tmdbBackdrop, getYearRange } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { AddToWatchlistButton } from "@/components/watchlist/add-to-watchlist-button";
import { ShowCard } from "@/components/shows/show-card";
import type { TMDBEpisode, TMDBSeasonDetail, TMDBShowDetail } from "@/lib/types";

const UPCOMING_WINDOW_DAYS = 28;
const RECENT_FINISHED_DAYS = 30;

const shortDateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const monthNameFormatter = new Intl.DateTimeFormat("es-ES", {
  month: "long",
});

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

function formatDate(date: string, variant: "short" | "full" = "short") {
  const parsedDate = new Date(`${date}T12:00:00`);
  return (variant === "full" ? fullDateFormatter : shortDateFormatter).format(
    parsedDate
  );
}

function formatDateTile(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return {
    day: String(parsedDate.getDate()),
    month: monthNameFormatter.format(parsedDate),
  };
}

function buildEpisodeLabel(episode: TMDBEpisode) {
  return `T${episode.season_number} E${episode.episode_number}`;
}

function getEpisodeState(airDate: string | null, todayKey: string) {
  if (!airDate) return "Sin fecha";
  if (airDate === todayKey) return "Hoy";
  if (airDate > todayKey) return "Próximo";
  return "Emitido";
}

function getReleaseContext(show: TMDBShowDetail, today = new Date()) {
  const todayKey = toDateKey(today);
  const upcomingEndKey = toDateKey(addDays(today, UPCOMING_WINDOW_DAYS));
  const recentStartKey = toDateKey(addDays(today, -RECENT_FINISHED_DAYS));
  const nextEpisode = show.next_episode_to_air;
  const lastEpisode = show.last_episode_to_air;
  const isUpcomingSoon =
    !!nextEpisode?.air_date &&
    nextEpisode.air_date >= todayKey &&
    nextEpisode.air_date <= upcomingEndKey;
  const isSeasonInProgress =
    !!nextEpisode?.air_date &&
    !!lastEpisode?.air_date &&
    nextEpisode.season_number === lastEpisode.season_number &&
    lastEpisode.air_date <= todayKey &&
    nextEpisode.air_date >= todayKey;
  const isRecentlyFinished =
    !!lastEpisode?.air_date &&
    lastEpisode.air_date >= recentStartKey &&
    lastEpisode.air_date <= todayKey &&
    (!nextEpisode || nextEpisode.season_number !== lastEpisode.season_number);

  return {
    todayKey,
    nextEpisode,
    isUpcomingSoon,
    seasonNumberForDates: isSeasonInProgress
      ? nextEpisode.season_number
      : isRecentlyFinished
        ? lastEpisode.season_number
        : null,
    seasonState: isSeasonInProgress
      ? "in-progress"
      : isRecentlyFinished
        ? "recently-finished"
        : null,
  } as const;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return {};

  try {
    const show = await getShowDetail(numId);
    const description = show.overview
      ? show.overview.slice(0, 160) + (show.overview.length > 160 ? "…" : "")
      : undefined;

    const images = [
      tmdbBackdrop(show.backdrop_path, "w1280"),
      tmdbImage(show.poster_path, "w780"),
    ].filter(Boolean) as string[];

    return {
      title: show.name,
      description,
      openGraph: {
        type: "video.tv_show",
        title: show.name,
        description,
        images,
      },
    };
  } catch {
    return {};
  }
}

export default async function ShowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  if (isNaN(numId)) notFound();

  let show;
  try {
    show = await getShowDetail(numId);
  } catch {
    notFound();
  }

  // Check if user has this show in their watchlist
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isInWatchlist = false;
  let currentStatus: "pending" | "watching" | "seen" = "pending";
  if (user) {
    const { data } = await supabase
      .from("watchlist")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("tmdb_id", numId)
      .maybeSingle();
    isInWatchlist = !!data;
    if (data?.status) currentStatus = data.status;
  }

  const posterUrl = tmdbImage(show.poster_path, "w500");
  const backdropUrl = tmdbBackdrop(show.backdrop_path, "w1280");
  const yearRange = getYearRange(show.first_air_date, show.last_air_date, show.status);
  const score = show.vote_average?.toFixed(1);
  const cast = show.credits?.cast?.slice(0, 8) ?? [];
  const recommendations = show.recommendations?.results?.slice(0, 10) ?? [];
  const similar = show.similar?.results?.slice(0, 10) ?? [];
  const releaseContext = getReleaseContext(show);
  let releaseSeason: TMDBSeasonDetail | null = null;

  if (releaseContext.seasonNumberForDates !== null) {
    try {
      releaseSeason = await getSeasonDetail(
        numId,
        releaseContext.seasonNumberForDates
      );
    } catch {
      releaseSeason = null;
    }
  }

  return (
    <>
      {/* Backdrop + transparent header */}
      <div className="relative h-[336px] w-full overflow-hidden sm:h-[416px]">
        <Header variant="transparent" />
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            loading="eager"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="-mt-32 relative z-10 flex flex-col gap-6 sm:flex-row sm:gap-8">
          {/* Poster */}
          <div className="mx-auto w-[180px] shrink-0 sm:mx-0 sm:w-[220px]">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-xl">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={show.name}
                  fill
                  sizes="220px"
                  className="object-cover"
                  preload
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-muted text-muted-foreground text-sm">
                  Sin imagen
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-4 pb-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {show.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {yearRange && <span>{yearRange}</span>}
                {show.number_of_seasons && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>
                      {show.number_of_seasons}{" "}
                      {show.number_of_seasons === 1 ? "temporada" : "temporadas"}
                    </span>
                  </>
                )}
                {score && Number(score) > 0 && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <Badge variant="secondary" className="text-xs">
                      {score}
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <AddToWatchlistButton
              show={show}
              isInWatchlist={isInWatchlist}
              isAuthenticated={!!user}
              currentStatus={currentStatus}
            />

            {show.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {show.genres.map((g) => (
                  <Badge key={g.id} variant="outline" className="text-xs">
                    {g.name}
                  </Badge>
                ))}
              </div>
            )}

            {show.overview && (
              <div>
                <h2 className="mb-1 text-sm font-semibold">Sinopsis</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {show.overview}
                </p>
              </div>
            )}

            <ReleaseCalendar
              nextEpisode={
                releaseContext.isUpcomingSoon ? releaseContext.nextEpisode : null
              }
              season={releaseSeason}
              seasonState={releaseContext.seasonState}
              todayKey={releaseContext.todayKey}
            />

            {cast.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold">Reparto</h2>
                <div className="flex flex-wrap gap-2">
                  {cast.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 rounded-full bg-muted py-1.5 pl-1.5 pr-3"
                    >
                      {member.profile_path ? (
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={tmdbImage(member.profile_path, "w92")!}
                            alt={member.name}
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-6 w-6 shrink-0 rounded-full bg-muted-foreground/20" />
                      )}
                      <span className="text-xs">
                        <span className="font-medium">{member.name}</span>
                        {member.character && (
                          <span className="text-muted-foreground">
                            {" "}
                            como {member.character}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {show.networks.length > 0 && (
              <div>
                <h2 className="mb-1 text-sm font-semibold">Disponible en</h2>
                <div className="flex flex-wrap gap-2">
                  {show.networks.map((n) => (
                    <Badge key={n.id} variant="secondary" className="text-xs">
                      {n.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Relacionadas</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="w-[150px] shrink-0">
                  <ShowCard show={rec} />
                </div>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-10 pb-10">
            <h2 className="mb-4 text-lg font-semibold">Series similares</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {similar.map((s) => (
                <div key={s.id} className="w-[150px] shrink-0">
                  <ShowCard show={s} />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

function ReleaseCalendar({
  nextEpisode,
  season,
  seasonState,
  todayKey,
}: {
  nextEpisode: TMDBEpisode | null;
  season: TMDBSeasonDetail | null;
  seasonState: "in-progress" | "recently-finished" | null;
  todayKey: string;
}) {
  const datedEpisodes =
    season?.episodes.filter(
      (episode): episode is TMDBEpisode & { air_date: string } =>
        !!episode.air_date
    ) ?? [];

  if (!nextEpisode && datedEpisodes.length === 0) return null;

  const sectionTitle = season ? season.name : "Próximo estreno";
  const sectionDescription =
    seasonState === "recently-finished"
      ? "Temporada finalizada en los últimos 30 días."
      : season
        ? "Temporada en emisión."
        : "Anunciado para las próximas 4 semanas.";

  return (
    <section className="rounded-lg border bg-card/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold">{sectionTitle}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {sectionDescription}
          </p>
        </div>

        {seasonState && (
          <Badge variant="secondary" className="self-start">
            {seasonState === "in-progress" ? "En emisión" : "Reciente"}
          </Badge>
        )}
      </div>

      {nextEpisode?.air_date && (
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-3 rounded-lg bg-primary/10 p-3">
          <time
            dateTime={nextEpisode.air_date}
            className="flex min-w-20 flex-col items-center justify-center rounded-md bg-background px-3 py-2 text-center shadow-sm ring-1 ring-border"
          >
            <span className="text-2xl font-semibold leading-none">
              {formatDateTile(nextEpisode.air_date).day}
            </span>
            <span className="mt-1 text-xs font-medium text-muted-foreground">
              {formatDateTile(nextEpisode.air_date).month}
            </span>
          </time>

          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default">
                {nextEpisode.episode_number === 1
                  ? "Estreno de temporada"
                  : "Próximo episodio"}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                {buildEpisodeLabel(nextEpisode)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">
              {nextEpisode.name || "Episodio sin título"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(nextEpisode.air_date, "full")}
            </p>
          </div>
        </div>
      )}

      {datedEpisodes.length > 0 && (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {datedEpisodes.map((episode) => {
            const episodeState = getEpisodeState(episode.air_date, todayKey);

            return (
              <li
                key={episode.id}
                className="grid grid-cols-[7rem_1fr] gap-3 rounded-lg bg-muted/40 p-3"
              >
                <time
                  dateTime={episode.air_date}
                  className="text-xs font-medium text-muted-foreground"
                >
                  {formatDate(episode.air_date)}
                </time>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs font-medium">
                      {buildEpisodeLabel(episode)}
                    </span>
                    <Badge
                      variant={episodeState === "Hoy" ? "default" : "outline"}
                      className="h-4 px-1.5 text-[10px]"
                    >
                      {episodeState}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {episode.name || "Episodio sin título"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {seasonState === "in-progress" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" aria-hidden="true" />
          Las fechas pueden cambiar si la cadena actualiza el calendario.
        </p>
      )}
    </section>
  );
}
