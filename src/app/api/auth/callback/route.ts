import { createClient } from "@/lib/supabase/server";
import { isOwner, ownerId, PRIVATE_CACHE_CONTROL, safeReturnPath } from "@/lib/owner-policy";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), {
    headers: { "Cache-Control": PRIVATE_CACHE_CONTROL },
  });
  if (!ownerId()) return go("/login?error=private");
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data, error: claimsError } = await supabase.auth.getClaims();
      if (!claimsError && isOwner(data?.claims)) {
        return go(safeReturnPath(searchParams.get("next")));
      }
      await supabase.auth.signOut({ scope: "local" });
      return go("/login?error=private");
    }
  }
  return go("/login?error=auth");
}
