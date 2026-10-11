import { denyUnlessOwner } from "@/lib/auth";
import { getTrending } from "@/lib/tmdb";
import { PRIVATE_CACHE_CONTROL } from "@/lib/owner-policy";
import { NextResponse } from "next/server";

export async function GET() {
  const denied = await denyUnlessOwner();
  if (denied) return denied;
  const data = await getTrending();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": PRIVATE_CACHE_CONTROL,
    },
  });
}
