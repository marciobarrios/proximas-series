import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import { isOwner, ownerId, PRIVATE_CACHE_CONTROL } from "./owner-policy";

const getVerifiedClaims = cache(async () => {
  if (!ownerId()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return error ? null : data?.claims ?? null;
});

export async function requireOwner() {
  const claims = await getVerifiedClaims();
  if (!isOwner(claims) || !claims) redirect("/login");
  return claims;
}

export async function denyUnlessOwner() {
  const claims = await getVerifiedClaims();
  if (isOwner(claims)) return null;
  return NextResponse.json({ error: "Acceso privado" }, {
    status: !ownerId() ? 503 : claims ? 403 : 401,
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
  });
}
