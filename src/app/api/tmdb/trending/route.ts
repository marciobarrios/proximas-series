import { getTrending } from "@/lib/tmdb";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await getTrending();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
