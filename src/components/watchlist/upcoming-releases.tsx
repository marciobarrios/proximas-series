import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { tmdbImage } from "@/lib/constants";
import type { UpcomingRelease } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

function formatAirDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00`));
}

export function UpcomingReleases({
  releases,
  compact = false,
}: {
  releases: UpcomingRelease[];
  compact?: boolean;
}) {
  if (releases.length === 0) {
    return (
      <section className="rounded-lg border border-dashed bg-muted/30 px-4 py-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Próximos estrenos
          </h2>
          <p className="text-sm text-muted-foreground">
            Sin estrenos anunciados
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {compact ? "Tus próximos estrenos" : "Próximos estrenos"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Episodios de tus series guardadas en las próximas 4 semanas.
          </p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {releases.map((release) => (
          <UpcomingReleaseCard
            key={`${release.tmdb_id}-${release.air_date}`}
            release={release}
          />
        ))}
      </div>
    </section>
  );
}

function UpcomingReleaseCard({ release }: { release: UpcomingRelease }) {
  const posterUrl = tmdbImage(release.poster_path, "w154");

  return (
    <Link
      href={`/serie/${release.tmdb_id}`}
      className="group grid w-[280px] shrink-0 grid-cols-[64px_1fr] gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-md bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={release.title}
            fill
            sizes="64px"
            className="object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Sin imagen
          </div>
        )}
      </div>

      <div className="min-w-0 py-0.5">
        <time
          dateTime={release.air_date}
          className="text-sm font-semibold capitalize text-foreground"
        >
          {formatAirDate(release.air_date)}
        </time>
        <h3 className="mt-1 line-clamp-1 text-sm font-medium">
          {release.title}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {release.label}
          {release.episode_name ? ` · ${release.episode_name}` : ""}
        </p>
        {release.is_season_premiere && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Estreno de temporada
          </Badge>
        )}
      </div>
    </Link>
  );
}
