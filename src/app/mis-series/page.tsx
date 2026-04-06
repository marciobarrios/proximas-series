import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { WatchlistGrid } from "@/components/watchlist/watchlist-grid";
import { EmptyWatchlist } from "@/components/watchlist/empty-watchlist";
import { LoginButton } from "@/components/auth/login-button";
import { WatchlistFilters } from "./watchlist-filters";
import type { WatchlistItem } from "@/lib/types";

export default async function MisSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
          <h1 className="text-xl font-semibold">Inicia sesion</h1>
          <p className="mt-2 mb-6 max-w-sm text-sm text-muted-foreground">
            Necesitas una cuenta para guardar series en tu lista.
          </p>
          <LoginButton />
        </main>
      </>
    );
  }

  let query = supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (filtro) {
    query = query.eq("status", filtro);
  }

  const { data: items } = await query;
  const watchlist = (items ?? []) as WatchlistItem[];

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Mis series</h1>
          <WatchlistFilters current={filtro} />
        </div>
        {watchlist.length === 0 ? (
          <EmptyWatchlist />
        ) : (
          <WatchlistGrid items={watchlist} />
        )}
      </main>
    </>
  );
}
