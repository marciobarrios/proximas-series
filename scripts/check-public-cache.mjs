import assert from "node:assert/strict";

// Run against `next start` or a deployment, never `next dev` (which skips ISR).
const base = process.env.BASE_URL ?? "http://localhost:3000";
const showId = process.env.SHOW_ID ?? "37636";
const url = new URL(`/serie/${showId}`, base);

async function request(options, target = url) {
  const response = await fetch(target, {
    ...options,
    redirect: "manual", // Do not accidentally test a preview's Vercel login page.
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200,
    `${target.pathname} must be accessible without a login redirect`);
  await response.arrayBuffer();
  return response;
}

await request(); // Populate an on-demand ISR entry.
for (const options of [
  {},
  { method: "HEAD" },
  { headers: { Cookie: "sb-test-auth-token=invalid-test-session" } },
  { headers: { RSC: "1", "Next-Router-Prefetch": "1" } },
  { headers: { "User-Agent": "bingbot/2.0" } },
]) {
  const response = await request(options);
  const cache = response.headers.get("x-vercel-cache") ??
    response.headers.get("x-nextjs-cache");
  const policy = response.headers.get("cache-control") ?? "";
  const variant = options.headers?.RSC ? "RSC" : options.headers?.["User-Agent"] ?? "HTML";
  console.log(`${options.method ?? "GET"} ${variant}: cache=${cache}; ${policy}`);
  assert.equal(cache, "HIT", "Repeated public requests must avoid rendering");
  assert.doesNotMatch(policy, /private|no-store/, "Public HTML must be cacheable");
  assert.equal(response.headers.get("set-cookie"), null,
    "Cached public HTML must never refresh or share a user's session");
  if (options.headers?.RSC) {
    assert.match(response.headers.get("content-type") ?? "", /text\/x-component/,
      "Client navigation must receive the RSC payload, not HTML");
  }
}

console.log("Public show HTML, HEAD, RSC, and crawler requests use the shared cache.");

// next start exposes origin policies but has no Vercel CDN for route handlers.
// On Vercel, s-maxage is consumed by the CDN; require actual edge HITs instead.
for (const [route, lifetime] of [
  [`/api/tmdb/show/${showId}`, 86400],
  ["/api/tmdb/trending", 86400],
  ["/api/tmdb/search?q=breaking", 3600],
]) {
  const target = new URL(route, base);
  await request({}, target);
  // Vercel can cache API HEAD responses separately from GET responses.
  await request({ method: "HEAD" }, target);
  for (const options of [
    {},
    { method: "HEAD" },
    { headers: { Cookie: "sb-test-auth-token=invalid-test-session" } },
  ]) {
    const response = await request(options, target);
    const cache = response.headers.get("x-vercel-cache");
    const policy = response.headers.get("cache-control") ?? "";
    console.log(`${options.method ?? "GET"} ${route}: cache=${cache ?? "origin only"}; ${policy}`);
    assert.match(response.headers.get("content-type") ?? "", /application\/json/,
      "Public APIs must return JSON, not an HTML error or login page");
    assert.equal(response.headers.get("set-cookie"), null,
      "Cached public JSON must never refresh or share a user's session");
    assert.match(policy, /(?:^|,\s*)public(?:,|$)/);
    assert.doesNotMatch(policy, /private|no-store/);
    assert.match(policy, /(?:^|,\s*)max-age=300(?:,|$)/,
      "Public JSON must retain its five-minute browser cache");
    if (cache !== null) {
      assert.equal(cache, "HIT", "Repeated public API requests must avoid function invocations");
    } else {
      assert.match(policy, new RegExp(`(?:^|,\\s*)s-maxage=${lifetime}(?:,|$)`),
        "The origin must declare the expected CDN lifetime");
    }
  }
}

console.log("Public JSON policies passed; CDN reuse verified where x-vercel-cache is available.");
