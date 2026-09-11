import type { Metadata } from "next";
import { getTrending } from "@/lib/tmdb";
import { getAuthClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUpcomingReleases } from "@/lib/upcoming-releases";
import { ShowGrid } from "@/components/shows/show-grid";
import { Header } from "@/components/layout/header";
import { UpcomingReleases } from "@/components/watchlist/upcoming-releases";
import type { UpcomingRelease, WatchlistItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "Tendencias",
  description: "Las series más populares de la semana",
};

export default async function Home() {
  const [trending, claims] = await Promise.all([
    getTrending(),
    getAuthClaims(),
  ]);

  let upcomingReleases: UpcomingRelease[] = [];

  if (claims) {
    const supabase = await createClient();
    const { data: items } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", claims.sub)
      .order("added_at", { ascending: false });

    upcomingReleases = await getUpcomingReleases(
      (items ?? []) as WatchlistItem[]
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {upcomingReleases.length > 0 && (
          <div className="mb-10">
            <UpcomingReleases
              releases={upcomingReleases.slice(0, 6)}
              compact
            />
          </div>
        )}
        <section>
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            Tendencias de la semana
          </h2>
          <ShowGrid shows={trending.results.slice(0, 20)} />
        </section>
      </main>
    </>
  );
}
