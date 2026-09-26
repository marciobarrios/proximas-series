import { getTrending } from "@/lib/tmdb";
import { PUBLIC_TMDB_CACHE_CONTROL } from "@/lib/cache-policy";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await getTrending();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PUBLIC_TMDB_CACHE_CONTROL,
    },
  });
}
