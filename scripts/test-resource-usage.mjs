import { generateKeyPairSync, sign } from "node:crypto";
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
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwks = path.join(temp, "jwks.json");
const authLog = path.join(temp, "auth.log");
function cookie(sub, forged = false, anonymous = false) {
  const encode = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = { sub, exp, iat: exp - 3600, aud: "authenticated", role: "authenticated",
    iss: "https://fixture.supabase.co/auth/v1", is_anonymous: anonymous, user_metadata: {} };
  const raw = `${encode({ alg: "ES256", typ: "JWT", kid: "fixture" })}.${encode(payload)}`;
  const signature = sign("sha256", Buffer.from(raw), { key: privateKey, dsaEncoding: "ieee-p1363" });
  if (forged) signature[0] ^= 255;
  const session = { access_token: `${raw}.${signature.toString("base64url")}`,
    refresh_token: "fixture-refresh", expires_at: exp, expires_in: 3600, token_type: "bearer",
    user: { id: sub, app_metadata: {}, user_metadata: {}, aud: "authenticated" } };
  return `sb-fixture-auth-token=base64-${encode(session)}`;
}
const port = process.env.TEST_PORT ?? "3107";
const base = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  OWNER_USER_ID: owner,
  AUTH_FIXTURE_JWKS: jwks,
  AUTH_FIXTURE_LOG: authLog,
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
  await writeFile(jwks, JSON.stringify({ keys: [{ ...publicKey.export({ format: "jwk" }), kid: "fixture", alg: "ES256", use: "sig" }] }));
  await writeFile(log, "");
  await writeFile(authLog, "");
  await writeFile(state, JSON.stringify({ advanceMs: 0, fail: false }));
  // Isolate the fixture cache from a developer's normal build and API data.
  await rm(path.join(root, ".next"), { recursive: true, force: true });
  const build = spawn(process.execPath, [next, "build", "--webpack"], {
    env, stdio: "inherit",
  });
  assert.equal((await once(build, "exit"))[0], 0, "Production build must pass");
  server = spawn(process.execPath, [
    "--import", path.join(root, "scripts/fixtures/auth.mjs"),
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

  const routes = ["/", "/mis-series", "/serie/37636", "/serie/37636?x=1", "/serie/37636?_rsc",
    "/api/tmdb/show/37636", "/api/tmdb/trending", "/api/tmdb/search?q=fixture"];
  for (const route of routes) {
    for (const options of [{}, { method: "HEAD" }, { method: "POST", headers: { "Next-Action": "invalid" } },
      { headers: { RSC: "1", "Next-Router-Prefetch": "1" } },
      { headers: { "User-Agent": "bingbot/2.0" } }]) {
      const res = await request(route, options);
      assert.ok([307, 401].includes(res.status), `${route}: ${res.status}`);
      assert.match(res.headers.get("cache-control"), /no-store/);
      assert.doesNotMatch(await res.text(), /Cache fixture/);
    }
  }
  assert.equal(await readFile(authLog, "utf8"), "", "Anonymous requests never call Supabase");
  for (const [session, expected] of [[cookie(other), 403], [cookie(owner, true), 401],
    [cookie(owner, false, true), 403]]) {
    for (const route of routes) {
      const res = await request(route, { headers: { Cookie: session } });
      assert.ok(res.status === expected || (expected === 401 && res.status === 307), `${route}: ${res.status}`);
      assert.doesNotMatch(await res.text(), /Cache fixture/);
    }
  }
  assert.equal(await readFile(log, "utf8"), "", "Denied requests must never call TMDB");
  assert.doesNotMatch(await readFile(authLog, "utf8"), /rest\/v1/, "Denied users must never query the database");
  const authorized = (route, options = {}) => request(route, {
    ...options, headers: { Cookie: cookie(owner), ...options.headers },
  });
  const first = await authorized("/serie/37636");
  assert.equal(first.status, 200, output);
  assert.match(first.headers.get("cache-control"), /private.*no-store/);
  assert.match(await first.text(), /Cache fixture/);
  const callsAfterFirst = await readFile(log, "utf8");
  for (const options of [{}, { method: "HEAD" }, { headers: { RSC: "1" } }]) {
    const res = await authorized(options.headers?.RSC ? "/serie/37636?_rsc" : "/serie/37636", options);
    assert.equal(res.status, 200, `${JSON.stringify(options)} ${res.headers.get("location")}`);
    assert.match(res.headers.get("cache-control"), /private.*no-store/);
    if (options.headers?.RSC) assert.match(res.headers.get("content-type"), /text\/x-component/);
    await res.text();
  }
  for (const id of ["37636junk", "037636", "-1", "0", "1e3", "9007199254740992"]) {
    assert.equal((await authorized(`/api/tmdb/show/${id}`)).status, 400);
  }
  const api = await authorized("/api/tmdb/show/37636");
  assert.equal(api.status, 200);
  assert.match(api.headers.get("cache-control"), /private.*no-store/);
  assert.equal((await api.json()).name, "Cache fixture");
  assert.equal(await readFile(log, "utf8"), callsAfterFirst,
    "Owner pages and API must reuse compact persisted data");
  // A warmed owner response must still be inaccessible to everyone else.
  for (const route of routes) {
    assert.ok([307, 401].includes((await request(route)).status));
    assert.equal((await request(route, { headers: { Cookie: cookie(other) } })).status, 403);
  }
  for (const route of ["/", "/mis-series", "/api/tmdb/trending", "/api/tmdb/search?q=fixture"]) {
    const res = await authorized(route);
    assert.equal(res.status, 200, `${route}: ${output}`);
    assert.match(res.headers.get("cache-control"), /private.*no-store/);
    await res.text();
  }

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

  const missing = await authorized("/api/tmdb/show/999999999");
  assert.equal(missing.status, 404);
  assert.match(missing.headers.get("cache-control"), /no-store/);
  const failure = await authorized("/serie/999999998");
  const body = await failure.text();
  assert.ok(failure.status === 500 || body.includes("digest"));
  assert.doesNotMatch(body, /NEXT_HTTP_ERROR_FALLBACK;404/);
  server.kill("SIGTERM");
  await once(server, "exit");
  server = spawn(process.execPath, [next, "start", "-p", port], {
    env: { ...env, OWNER_USER_ID: "" }, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await request("/robots.txt")).ok) break; } catch {}
    await delay(100);
  }
  for (const route of routes) assert.equal((await request(route)).status, 503,
    "Missing owner configuration must fail closed");
  console.log("PASS: owner access, signed non-owner/forged/anonymous denial, no public cache, compact shared data, fail-closed configuration.");
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
  await rm(temp, { recursive: true, force: true });
  // Never leave a fixture build that could accidentally be deployed.
  await rm(path.join(root, ".next"), { recursive: true, force: true });
}
