"use client";

import { useOptimistic, useTransition } from "react";
import { addToWatchlist, removeFromWatchlist } from "@/app/actions/watchlist";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TMDBShowDetail } from "@/lib/types";

interface Props {
  show: TMDBShowDetail;
  isInWatchlist: boolean;
  isAuthenticated: boolean;
}

export function AddToWatchlistButton({
  show,
  isInWatchlist,
  isAuthenticated,
}: Props) {
  const [optimisticInList, setOptimisticInList] = useOptimistic(isInWatchlist);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
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
      setOptimisticInList(!optimisticInList);

      const fd = new FormData();
      fd.set("tmdb_id", String(show.id));
      fd.set("title", show.name);
      fd.set("poster_path", show.poster_path ?? "");
      fd.set("overview", show.overview ?? "");
      fd.set("first_air_date", show.first_air_date ?? "");
      fd.set("vote_average", String(show.vote_average ?? ""));
      fd.set("number_of_seasons", String(show.number_of_seasons ?? ""));

      if (optimisticInList) {
        await removeFromWatchlist(fd);
      } else {
        await addToWatchlist(fd);
      }
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant={optimisticInList ? "default" : "outline"}
      size="sm"
      className="gap-1.5"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          optimisticInList && "fill-current scale-110"
        )}
      />
      {optimisticInList ? "En mi lista" : "Añadir a mi lista"}
    </Button>
  );
}
