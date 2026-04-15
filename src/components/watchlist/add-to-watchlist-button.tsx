"use client";

import { useOptimistic, useTransition } from "react";
import {
  addToWatchlist,
  removeFromWatchlist,
  updateStatus,
} from "@/app/actions/watchlist";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Heart, Clock, Play, Eye, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TMDBShowDetail, WatchlistStatus } from "@/lib/types";

const statusOptions = [
  { status: "pending" as const, icon: Clock, label: "Pendiente" },
  { status: "watching" as const, icon: Play, label: "Viendo" },
  { status: "seen" as const, icon: Eye, label: "Vista" },
];

interface Props {
  show: TMDBShowDetail;
  isInWatchlist: boolean;
  isAuthenticated: boolean;
  currentStatus?: WatchlistStatus;
}

export function AddToWatchlistButton({
  show,
  isInWatchlist,
  isAuthenticated,
  currentStatus = "pending",
}: Props) {
  const [optimisticInList, setOptimisticInList] = useOptimistic(isInWatchlist);
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  const activeOption = statusOptions.find((o) => o.status === optimisticStatus)!;
  const ActiveIcon = activeOption.icon;

  function handleAdd() {
    if (!isAuthenticated) {
      const supabase = createClient();
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/serie/${show.id}`,
        },
      });
      return;
    }

    startTransition(async () => {
      setOptimisticInList(true);

      const fd = new FormData();
      fd.set("tmdb_id", String(show.id));
      fd.set("title", show.name);
      fd.set("poster_path", show.poster_path ?? "");
      fd.set("overview", show.overview ?? "");
      fd.set("first_air_date", show.first_air_date ?? "");
      fd.set("vote_average", String(show.vote_average ?? ""));
      fd.set("number_of_seasons", String(show.number_of_seasons ?? ""));

      await addToWatchlist(fd);
    });
  }

  function handleStatusChange(newStatus: WatchlistStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      const fd = new FormData();
      fd.set("tmdb_id", String(show.id));
      fd.set("status", newStatus);
      await updateStatus(fd);
    });
  }

  function handleRemove() {
    startTransition(async () => {
      setOptimisticInList(false);
      setOptimisticStatus("pending");
      const fd = new FormData();
      fd.set("tmdb_id", String(show.id));
      await removeFromWatchlist(fd);
    });
  }

  // Not in watchlist → simple add button
  if (!optimisticInList) {
    return (
      <Button
        onClick={handleAdd}
        disabled={isPending}
        variant="outline"
        size="sm"
        className="gap-1.5"
      >
        <Heart className="h-4 w-4" />
        Añadir a mi lista
      </Button>
    );
  }

  // In watchlist → dropdown with status selector + remove
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        render={
          <Button variant="default" size="sm" className="gap-1.5" />
        }
      >
        <ActiveIcon
          className={cn(
            "h-4 w-4",
            optimisticStatus === "watching" && "text-orange-300",
          )}
        />
        {activeOption.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={optimisticStatus}
          onValueChange={(value) => handleStatusChange(value as WatchlistStatus)}
        >
          {statusOptions.map(({ status, icon: Icon, label }) => (
            <DropdownMenuRadioItem key={status} value={status}>
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleRemove}>
          <Trash2 className="h-4 w-4" />
          Eliminar de mi lista
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
