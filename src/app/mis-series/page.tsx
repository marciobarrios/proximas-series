import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { WatchlistGrid } from "@/components/watchlist/watchlist-grid";
import { EmptyWatchlist } from "@/components/watchlist/empty-watchlist";
import { UpcomingReleases } from "@/components/watchlist/upcoming-releases";
import { WatchlistFilters } from "./watchlist-filters";
import { getUpcomingReleases } from "@/lib/upcoming-releases";
import { isWatchlistStatus, type WatchlistItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Mis series",
  description: "Tu lista personal de series por ver",
};

export default async function MisSeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const currentFilter = isWatchlistStatus(filtro) ? filtro : undefined;
  const claims = await requireOwner();

  const supabase = await createClient();
  const { data: allItems } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", claims.sub)
    .order("added_at", { ascending: false });

  const allWatchlist = (allItems ?? []) as WatchlistItem[];
  const upcomingReleases = await getUpcomingReleases(allWatchlist);
  const watchlist = currentFilter
    ? allWatchlist.filter((item) => item.status === currentFilter)
    : allWatchlist;

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Mis series</h1>
          <WatchlistFilters current={currentFilter} />
        </div>
        {allWatchlist.length > 0 && (
          <div className="mb-8">
            <UpcomingReleases releases={upcomingReleases} />
          </div>
        )}
        {watchlist.length === 0 ? (
          <EmptyWatchlist />
        ) : (
          <WatchlistGrid items={watchlist} />
        )}
      </main>
    </>
  );
}
