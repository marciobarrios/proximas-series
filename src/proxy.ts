import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isOwner, ownerId, PRIVATE_CACHE_CONTROL } from "@/lib/owner-policy";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path === "/api/auth/callback") {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });
  const finish = (response: NextResponse) => {
    for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    response.headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
    return response;
  };
  const deny = (status: number) => finish(
    path.startsWith("/api/") || status !== 401 || request.method !== "GET"
      ? NextResponse.json({ error: "Acceso privado" }, { status })
      : NextResponse.redirect(new URL("/login", request.url))
  );

  // Fail closed, including before the owner has been configured.
  if (!ownerId()) return deny(503);
  // Anonymous crawlers never need a request to Supabase or TMDB.
  if (!request.cookies.getAll().some(({ name }) => /^sb-.*-auth-token(?:\.\d+)?$/.test(name))) {
    return deny(401);
  }
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return deny(401);
  if (!isOwner(data.claims)) return deny(403);
  // Page, metadata, API and action guards repeat authorization at the data boundary.
  return finish(supabaseResponse);
}

export const config = {
  matcher: ["/((?!_next/static/|_next/image|favicon.ico$|robots.txt$).*)"],
};
