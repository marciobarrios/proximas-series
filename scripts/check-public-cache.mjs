import assert from "node:assert/strict";

// Run against `next start` or a deployment, never `next dev` (which skips ISR).
const base = process.env.BASE_URL ?? "http://localhost:3000";
const showId = process.env.SHOW_ID ?? "37636";
const url = new URL(`/serie/${showId}`, base);

async function request(options) {
  const response = await fetch(url, {
    ...options,
    redirect: "manual", // Do not accidentally test a preview's Vercel login page.
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200,
    "The show must exist and be accessible without a login redirect");
  await response.arrayBuffer();
  return response;
}

await request(); // Populate an on-demand ISR entry.
for (const options of [
  {},
  { method: "HEAD" },
  { headers: { Cookie: "sb-test-auth-token=invalid-test-session" } },
]) {
  const response = await request(options);
  const cache = response.headers.get("x-vercel-cache") ??
    response.headers.get("x-nextjs-cache");
  const policy = response.headers.get("cache-control") ?? "";
  console.log(`${options.method ?? "GET"}: cache=${cache}; ${policy}`);
  assert.equal(cache, "HIT", "Repeated public requests must avoid rendering");
  assert.doesNotMatch(policy, /private|no-store/, "Public HTML must be cacheable");
  assert.equal(response.headers.get("set-cookie"), null,
    "Cached public HTML must never refresh or share a user's session");
}

console.log("Public show HTML and HEAD requests use the shared cache.");
