import { denyUnlessOwner } from "@/lib/auth";
import { searchShows } from "@/lib/tmdb";
import { PRIVATE_CACHE_CONTROL } from "@/lib/owner-policy";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const denied = await denyUnlessOwner();
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] }, { headers: { "Cache-Control": PRIVATE_CACHE_CONTROL } });
  }

  const data = await searchShows(query);
  return NextResponse.json(data, {
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
  });
}
