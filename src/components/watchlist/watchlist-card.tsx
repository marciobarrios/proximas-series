"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { updateStatus, removeFromWatchlist } from "@/app/actions/watchlist";
import { tmdbImage, getYear } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WatchlistItem, WatchlistStatus } from "@/lib/types";

const statusOptions = [
  { status: "pending" as const, icon: Clock, label: "Pendiente" },
  { status: "watching" as const, icon: Play, label: "Viendo" },
  { status: "seen" as const, icon: Eye, label: "Vista" },
];

export function WatchlistCard({ item }: { item: WatchlistItem }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(item.status);
  const [isPending, startTransition] = useTransition();

  const posterUrl = tmdbImage(item.poster_path, "w342");
  const year = getYear(item.first_air_date);

  function handleStatusChange(newStatus: WatchlistStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      const fd = new FormData();
      fd.set("tmdb_id", String(item.tmdb_id));
      fd.set("status", newStatus);
      await updateStatus(fd);
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
        optimisticStatus === "seen" && "opacity-60"
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
        {optimisticStatus === "seen" && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
            Vista
          </Badge>
        )}
        {optimisticStatus === "watching" && (
          <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">
            Viendo
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
        {statusOptions.map(({ status, icon: Icon, label }) => (
          <Button
            key={status}
            onClick={() => handleStatusChange(status)}
            disabled={isPending}
            variant={optimisticStatus === status ? "secondary" : "ghost"}
            size="xs"
            className="flex-1"
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
        <Button
          onClick={handleRemove}
          disabled={isPending}
          variant="ghost"
          size="xs"
          className="w-6 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
