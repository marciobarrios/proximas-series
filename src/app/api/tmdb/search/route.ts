import { searchShows } from "@/lib/tmdb";
import { SEARCH_CACHE_CONTROL } from "@/lib/cache-policy";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const data = await searchShows(query);
  return NextResponse.json(data, {
    headers: { "Cache-Control": SEARCH_CACHE_CONTROL },
  });
}
