import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export const getAuthClaims = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) return null;

  return data?.claims ?? null;
});

export async function requireAuth() {
  const claims = await getAuthClaims();
  if (!claims) {
    redirect("/");
  }
  return claims;
}
