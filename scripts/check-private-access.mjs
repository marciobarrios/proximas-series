import assert from "node:assert/strict";
const base = process.env.BASE_URL ?? "http://localhost:3000";
for (const path of ["/", "/mis-series", "/serie/37636", "/api/tmdb/show/37636", "/api/tmdb/trending", "/api/tmdb/search?q=test"]) {
  const response = await fetch(new URL(path, base), { redirect: "manual", signal: AbortSignal.timeout(15000) });
  assert.ok([307, 401].includes(response.status), `${path}: expected login/unauthorized, got ${response.status}`);
  if (response.status === 307) assert.equal(new URL(response.headers.get("location")).pathname, "/login");
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  console.log(`${path}: denied`);
}
console.log("Anonymous access denied. Run test:resources for owner and forged-session coverage.");
