import Image from "next/image";
import { notFound } from "next/navigation";
import { getShowDetail } from "@/lib/tmdb";
import { createClient } from "@/lib/supabase/server";
import { tmdbImage, tmdbBackdrop, getYearRange } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { AddToWatchlistButton } from "@/components/watchlist/add-to-watchlist-button";
import { ShowCard } from "@/components/shows/show-card";

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
  if (user) {
    const { data } = await supabase
      .from("watchlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("tmdb_id", numId)
      .maybeSingle();
    isInWatchlist = !!data;
  }

  const posterUrl = tmdbImage(show.poster_path, "w500");
  const backdropUrl = tmdbBackdrop(show.backdrop_path, "w1280");
  const yearRange = getYearRange(show.first_air_date, show.last_air_date, show.status);
  const score = show.vote_average?.toFixed(1);
  const cast = show.credits?.cast?.slice(0, 8) ?? [];
  const recommendations = show.recommendations?.results?.slice(0, 10) ?? [];
  const similar = show.similar?.results?.slice(0, 10) ?? [];

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
