import { getShowDetail, TMDBError } from "@/lib/tmdb";
import { parseTmdbId } from "@/lib/tmdb-id";
import { PUBLIC_TMDB_CACHE_CONTROL } from "@/lib/cache-policy";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseTmdbId(id);

  if (numId === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const data = await getShowDetail(numId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": PUBLIC_TMDB_CACHE_CONTROL },
    });
  } catch (error) {
    if (error instanceof TMDBError && error.status === 404) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }
    throw error;
  }
}
