import { denyUnlessOwner } from "@/lib/auth";
import { getShowDetail, TMDBError } from "@/lib/tmdb";
import { parseTmdbId } from "@/lib/tmdb-id";
import { PRIVATE_CACHE_CONTROL } from "@/lib/owner-policy";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await denyUnlessOwner();
  if (denied) return denied;
  const { id } = await params;
  const numId = parseTmdbId(id);

  if (numId === null) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400, headers: { "Cache-Control": PRIVATE_CACHE_CONTROL } });
  }

  try {
    const data = await getShowDetail(numId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
    });
  } catch (error) {
    if (error instanceof TMDBError && error.status === 404) {
      return NextResponse.json({ error: "Show not found" }, { status: 404, headers: { "Cache-Control": PRIVATE_CACHE_CONTROL } });
    }
    throw error;
  }
}
