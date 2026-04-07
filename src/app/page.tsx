import type { Metadata } from "next";
import { getTrending } from "@/lib/tmdb";
import { ShowGrid } from "@/components/shows/show-grid";
import { Header } from "@/components/layout/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tendencias",
  description: "Las series más populares de la semana",
};

export default async function Home() {
  const trending = await getTrending();

  return (
    <>
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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
