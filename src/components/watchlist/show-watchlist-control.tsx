"use client";

import useSWR from "swr";
import { useSession } from "@/hooks/use-session";
import { createClient } from "@/lib/supabase/client";
import { isWatchlistStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  AddToWatchlistButton,
  type WatchlistShow,
} from "./add-to-watchlist-button";

export function ShowWatchlistControl({ show }: { show: WatchlistShow }) {
  const { session, isLoading: isSessionLoading } = useSession();
  const userId = session?.user.id;
  const { data, error, isLoading, mutate } = useSWR(
    userId ? ["show-watchlist", userId, show.id] as const : null,
    async ([, userId, showId]) => {
      // Supabase enforces access through the signed-in user's RLS policies.
      const { data, error } = await createClient()
        .from("watchlist")
        .select("status")
        .eq("user_id", userId)
        .eq("tmdb_id", showId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  );

  if (isSessionLoading || (userId && isLoading)) {
    return <Button variant="outline" size="sm" disabled>Cargando lista…</Button>;
  }

  if (userId && error) {
    return (
      <Button variant="outline" size="sm" onClick={() => void mutate()}>
        Reintentar cargar mi lista
      </Button>
    );
  }

  return (
    <AddToWatchlistButton
      key={`${userId ?? "guest"}:${show.id}`}
      show={show}
      isAuthenticated={!!userId}
      isInWatchlist={!!userId && !!data}
      currentStatus={userId && isWatchlistStatus(data?.status) ? data.status : "pending"}
      onUpdated={() => mutate()}
    />
  );
}
