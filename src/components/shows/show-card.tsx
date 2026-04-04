import Image from "next/image";
import Link from "next/link";
import { tmdbImage, getYear } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { TMDBShow } from "@/lib/types";

export function ShowCard({ show }: { show: TMDBShow }) {
  const posterUrl = tmdbImage(show.poster_path, "w342");
  const year = getYear(show.first_air_date);
  const score = show.vote_average?.toFixed(1);

  return (
    <Link
      href={`/serie/${show.id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg bg-card transition-transform duration-200 ease-out hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={show.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-opacity duration-200 group-hover:opacity-90"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}
        {score && Number(score) > 0 && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-black/70 text-white border-none text-xs"
          >
            {score}
          </Badge>
        )}
      </div>
      <div className="px-1 pt-2 pb-1">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">
          {show.name}
        </h3>
        {year && (
          <p className="mt-0.5 text-xs text-muted-foreground">{year}</p>
        )}
      </div>
    </Link>
  );
}
