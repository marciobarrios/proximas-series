import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const temp = await mkdtemp(path.join(tmpdir(), "series-cache-test-"));
const log = path.join(temp, "tmdb.log");
const state = path.join(temp, "state.json");
const port = process.env.TEST_PORT ?? "3107";
const base = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  TMDB_API_KEY: "fixture-only",
  NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-only",
  NEXT_FONT_GOOGLE_MOCKED_RESPONSES: path.join(root, "scripts/fixtures/fonts.cjs"),
  TMDB_FIXTURE_LOG: log,
  TMDB_FIXTURE_STATE: state,
};
const next = path.join(root, "node_modules/next/dist/bin/next");
let server;
let output = "";

async function request(route, options) {
  return fetch(new URL(route, base), {
    ...options, redirect: "manual", signal: AbortSignal.timeout(15_000),
  });
}

try {
  await writeFile(state, JSON.stringify({ advanceMs: 0, fail: false }));
  // Isolate the fixture cache from a developer's normal build and API data.
  await rm(path.join(root, ".next"), { recursive: true, force: true });
  const build = spawn(process.execPath, [next, "build", "--webpack"], {
    env, stdio: "inherit",
  });
  assert.equal((await once(build, "exit"))[0], 0, "Production build must pass");
  server = spawn(process.execPath, [
    "--import", path.join(root, "scripts/fixtures/tmdb.mjs"), next, "start", "-p", port,
  ], { env, stdio: ["ignore", "pipe", "pipe"] });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(output);
    try {
      ready = (await request("/robots.txt")).ok;
      if (ready) break;
    } catch {}
    await delay(100);
  }
  assert.ok(ready, `Server did not start: ${output}`);

  const first = await request("/serie/37636");
  const html = await first.text();
  assert.equal(first.status, 200);
  assert.match(html, /Cache fixture/);
  assert.match(html, /Fixture episode/);
  const policy = first.headers.get("cache-control") ?? "";
  console.log(`Show page cache policy: ${policy}`);
  assert.match(policy, /s-maxage=86400(?:,|$)/,
    "Public show pages must regenerate daily, not hourly");

  const callsAfterFirst = await readFile(log, "utf8");
  for (const options of [{}, { method: "HEAD" },
    { headers: { Cookie: "sb-test-auth-token=invalid-test-session" } },
    { headers: { RSC: "1", "Next-Router-Prefetch": "1" } },
    { headers: { "User-Agent": "bingbot/2.0" } }]) {
    const response = await request("/serie/37636", options);
    await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-nextjs-cache"), "HIT");
    assert.equal(response.headers.get("set-cookie"), null);
    if (options.headers?.RSC) {
      assert.match(response.headers.get("content-type"), /text\/x-component/);
    }
  }
  assert.equal(await readFile(log, "utf8"), callsAfterFirst,
    "Cache hits must not call TMDB again");

  for (const id of ["37636junk", "037636", "-1", "0", "1e3", "9007199254740992"]) {
    assert.equal((await request(`/api/tmdb/show/${id}`)).status, 400);
    const invalidPage = await request(`/serie/${id}`);
    const body = await invalidPage.text();
    assert.ok(invalidPage.status === 404 || body.includes("NEXT_HTTP_ERROR_FALLBACK;404"));
  }
  assert.equal(await readFile(log, "utf8"), callsAfterFirst,
    "Invalid IDs must not create upstream requests or duplicate show entries");

  const api = await request("/api/tmdb/show/37636");
  assert.equal(api.status, 200);
  assert.match(api.headers.get("cache-control"), /s-maxage=86400/);
  assert.equal((await api.json()).name, "Cache fixture");
  assert.equal(await readFile(log, "utf8"), callsAfterFirst,
    "The API and page must share their persisted detail data");
  const search = await request("/api/tmdb/search?q=fixture");
  assert.match(search.headers.get("cache-control"), /s-maxage=3600/);
  assert.equal((await search.json()).results[0].name, "Cache fixture");

  const rolloutCheck = spawn(process.execPath, [path.join(root, "scripts/check-public-cache.mjs")], {
    env: { ...env, BASE_URL: base, SHOW_ID: "37636" }, stdio: "inherit",
  });
  assert.equal((await once(rolloutCheck, "exit"))[0], 0,
    "The rollout check must also work against a local production origin");

  const files = await readdir(path.join(root, ".next/cache/fetch-cache"));
  let cacheBytes = 0;
  for (const file of files) {
    const content = await readFile(path.join(root, ".next/cache/fetch-cache", file), "utf8");
    const entry = JSON.parse(content);
    // fetch() stores base64 bodies; unstable_cache stores JSON directly.
    const decoded = entry.data?.headers
      ? Buffer.from(entry.data.body, "base64").toString()
      : entry.data?.body ?? content;
    assert.doesNotMatch(decoded, /UNUSED_TMDB_PAYLOAD/,
      "Unused provider data must be removed BEFORE writing to the data cache");
    cacheBytes += Buffer.byteLength(content);
  }
  console.log(`Persisted fixture data: ${cacheBytes} bytes in ${files.length} entries`);
  assert.ok(cacheBytes < 16_384, "Fixture data must fit in a small cache payload");

  const missing = await request("/api/tmdb/show/999999999");
  assert.equal(missing.status, 404);
  const failure = await request("/serie/999999998");
  const failureBody = await failure.text();
  assert.ok(failure.status === 500 || failureBody.includes('"digest"'));
  assert.ok(!failureBody.includes("NEXT_HTTP_ERROR_FALLBACK;404"),
    "Temporary TMDB failures must not replace ISR pages with a cached 404");

  // Advance the server clock past daily expiry, then simulate a provider outage.
  // Keep the real Next cache so this tests regeneration of an existing page.
  const callsBeforeOutage = await readFile(log, "utf8");
  await writeFile(state, JSON.stringify({ advanceMs: 25 * 60 * 60 * 1000, fail: true }));
  const stale = await request("/serie/37636");
  assert.equal(stale.headers.get("x-nextjs-cache"), "STALE");
  assert.match(await stale.text(), /Cache fixture/);
  let retried = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    if ((await readFile(log, "utf8")) !== callsBeforeOutage) { retried = true; break; }
    await delay(100);
  }
  assert.ok(retried, "Expired ISR must attempt a provider refresh");
  const retained = await request("/serie/37636");
  assert.equal(retained.status, 200);
  assert.match(await retained.text(), /Cache fixture/,
    "A provider outage must preserve the last good page");
  console.log("PASS: daily ISR, compact data, cache hits, IDs, API policies, stale-page preservation.");
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
  await rm(temp, { recursive: true, force: true });
  // Never leave a fixture build that could accidentally be deployed.
  await rm(path.join(root, ".next"), { recursive: true, force: true });
}
