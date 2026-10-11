import { readFileSync, appendFileSync } from "node:fs";
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const url = new URL(typeof input === "string" ? input : input.url ?? input);
  if (url.hostname !== "fixture.supabase.co") return originalFetch(input, options);
  appendFileSync(process.env.AUTH_FIXTURE_LOG, `${url.pathname}\n`);
  if (url.pathname === "/auth/v1/.well-known/jwks.json") {
    return Response.json(JSON.parse(readFileSync(process.env.AUTH_FIXTURE_JWKS, "utf8")));
  }
  if (url.pathname.startsWith("/rest/v1/")) return Response.json([]);
  return Response.json({ message: "Fixture: unauthorized", code: "bad_jwt" }, { status: 401 });
};
