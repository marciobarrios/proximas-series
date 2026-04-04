"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toggleSeen, removeFromWatchlist } from "@/app/actions/watchlist";
import { tmdbImage, getYear } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WatchlistItem } from "@/lib/types";

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const [optimisticSeen, setOptimisticSeen] = useOptimistic(item.seen);
  const [isPending, startTransition] = useTransition();

  const posterUrl = tmdbImage(item.poster_path, "w342");
  const year = getYear(item.first_air_date);

  function handleToggleSeen() {
    startTransition(async () => {
      setOptimisticSeen(!optimisticSeen);
      const fd = new FormData();
      fd.set("tmdb_id", String(item.tmdb_id));
      fd.set("seen", String(item.seen));
      await toggleSeen(fd);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("tmdb_id", String(item.tmdb_id));
      await removeFromWatchlist(fd);
    });
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg bg-card transition-opacity duration-200",
        optimisticSeen && "opacity-60"
      )}
    >
      <Link
        href={`/serie/${item.tmdb_id}`}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted"
      >
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sin imagen
          </div>
        )}
        {optimisticSeen && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
            Vista
          </Badge>
        )}
      </Link>

      <div className="px-1 pt-2 pb-1">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">
          {item.title}
        </h3>
        {year && (
          <p className="mt-0.5 text-xs text-muted-foreground">{year}</p>
        )}
      </div>

      <div className="flex gap-1 px-1 pb-2">
        <Button
          onClick={handleToggleSeen}
          disabled={isPending}
          variant="ghost"
          size="sm"
          className="h-8 flex-1 gap-1 text-xs"
        >
          {optimisticSeen ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              Pendiente
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              Vista
            </>
          )}
        </Button>
        <Button
          onClick={handleRemove}
          disabled={isPending}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
