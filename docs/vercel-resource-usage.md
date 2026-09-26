# Vercel resource audit — 26 September 2026

## Decision and delivery status

Use **24-hour refreshes** for public show pages and persisted TMDB data. A
**48-hour interval is an accepted fallback** if measurements after deployment
show that repeated revalidation still consumes too many resources. Extend both
the page and data lifetimes together; a longer lifetime does not prevent writes
for previously uncached show IDs.

PR #28 is deployed to production at commit `aaeecf3`. Post-merge checks confirm
shared cache hits for public pages and JSON APIs. Production usage reduction
remains unverified until comparable traffic windows are available. The follow-up
adds repeatable API rollout checks; no additional deployment or firewall change
was made during that follow-up.

## Observed cause

The supplied 12-hour screenshot attributes roughly 9K writes and 115.6 MB of
written data to `proximas-series`. The chart reports 21K write units and 2.7K
time-based revalidations across the selected environments. Operations, bytes,
and billed units are different measures: ISR units represent 8 KB of data.

The production deployment examined was `4ee0bac` (`dpl_2CxEKfQDevZ2ZJsUwfLEWadmx7jR`).
The fix builds on that version, including its existing prefetch/crawler improvements.

Direct production requests confirmed shared cache HITs for repeated public
HTML, HEAD, and a synthetic invalid-session cookie. Request details in Vercel
provided the more useful explanation for writes:

- At 08:41:18 UTC, `SERankingBacklinksBot` requested `/serie/59040`. Vercel
  reported a **cold MISS**, a **one-hour TTL**, an ISR function invocation, and
  an ISR cache update. Nearby requests walked successive show IDs about every
  12–17 seconds. Each first visit can generate another page and data entry.
- At 08:40:12 UTC, Bingbot requested `/serie/261318`. Vercel reported **STALE**,
  **time-based revalidation**, a cache age of 8h 6m, and background regeneration.
  Nearby requests formed a burst across many show pages.
- At 08:40:46 UTC, `SERankingBacklinksBot` also triggered time-based revalidation
  of `/serie/58950` after 1d 7h. The dashboard displayed a one-second TTL on these
  already-stale responses. This does not establish a configured one-second
  regeneration interval: the code and the cold response both showed one hour.

This is real crawler-driven generation and regeneration, not evidence that every
ordinary visit bypasses the cache. The sample identifies mechanisms and callers;
it does not establish what percentage of total writes each crawler caused.

The previous TMDB fetch cache also persisted complete responses before the UI
sliced them: full credits/crew, recommendation lists, and episode guest stars
could be stored despite never being displayed. A TypeScript response type does
not remove fields from the fetched JSON.

## Implemented policy

| Resource | New policy | Purpose |
| --- | --- | --- |
| Public show HTML/RSC | 24-hour ISR | Reduce the refresh frequency from hourly to daily |
| TMDB detail, season, release, trending | Compact 24-hour data cache | Reduce refreshes and bytes persisted |
| Show and trending JSON API | 24-hour CDN, five-minute browser cache | Avoid repeat function invocations |
| Search API | One-hour CDN, five-minute browser cache; no persistent query cache | Reuse repeated searches without durable entries per query |
| Search UI | No focus/reconnect refresh; five-minute deduplication | Avoid background requests for unchanged searches |
| Episode badges | Local date update after hydration, one shared browser timer | Keep “Hoy” current without regenerating HTML |
| Invalid IDs | Reject noncanonical or unsafe numbers before TMDB access | Avoid duplicate show entries such as `1abc` and `01` |
| TMDB failure | Only real 404s become “not found”; propagate transient failures | Let ISR preserve the last good page during outages |
| Backlink crawler | Add `SERankingBacklinksBot` to robots exclusions | Reduce catalog-wide generation by a crawler with no search-index benefit |

The implementation retains the existing Next.js caching model. `unstable_cache`
stores projected results; its inner fetch uses `no-store` so there is no second
raw-response cache. A migration to Cache Components is a separate architectural
change and is not required for this fix. The production regression verifies that
public pages remain prerendered and cacheable with this combination.

The configured page-refresh frequency is 24 times lower, and TMDB detail/season
refresh frequency is four times lower. These are **frequency comparisons**, not
promised billing reductions. Cold visits still write, and request timing, cache
eviction, response changes, and crawler behavior determine actual usage.

## Existing savings preserved

- Image transformations remain disabled. Images use TMDB's sized CDN URLs.
- Internal links keep `prefetch={false}`.
- The authentication proxy still matches only `/` and `/mis-series`.
- Public show pages keep session/watchlist state in the browser; authenticated
  mutations invalidate only the personal watchlist route.
- Functions remain in Frankfurt. Moving them just for a lower unit price may
  increase latency and duration; no region change is justified by this evidence.
- No cron, polling service, paid cache, or extra backend was introduced.

## Remaining costs and next decisions

1. **Crawler enforcement has the largest remaining potential.** `robots.txt`
   is advisory. SE Ranking documents a delay of up to one day before the crawler
   stops after a robots change. If it continues after that, inspect
   its traffic in the [project firewall](https://vercel.com/marcio-barrios-projects/proximas-series/firewall).
   A narrowly scoped WAF rule can stop it before ISR/functions run. Do not block
   generic `bot` user agents: the observed traffic also includes Bing indexing.
   No live firewall settings were changed in this task.
2. **Homepage and personal watchlist still render on the server.** Both include
   authenticated data. A static trending homepage with a separately loaded
   personal section could reduce anonymous home-page compute, at the cost of an
   additional authenticated request and a larger feature refactor. Measure `/`
   invocations before choosing that work. Never publicly cache personal HTML.
3. **Use two-day caching only if repeated refreshes remain material.** Change
   both lifetime declarations to 172800; accept that provider changes may take
   longer to appear. This will not fix a crawler generating thousands of new IDs.
4. **Keep deployment/build frequency proportional to actual changes.** No cron
   refresh or automated redeploy is needed. Web Analytics remains enabled as
   explicitly installed in the deployed version; its events are a separate meter.

## Post-merge review — 26 September 2026

Vercel reports production deployment
[`dpl_HeE8epSKAUAgmJ5NHT4xm3Enr1yk`](https://vercel.com/marcio-barrios-projects/proximas-series/HeE8epSKAUAgmJ5NHT4xm3Enr1yk)
as READY at **10:09:12 UTC**, with `proximas-series.vercel.app` assigned to the
exact merge commit `aaeecf381c92d45b39c8dfc6c911afae2c7b5302`.

Checks against that production alias confirmed:

- `/serie/37636`: shared HITs for HTML, HEAD, RSC, a synthetic invalid-session
  cookie, and a Bingbot user agent; no response set a session cookie.
- `/api/tmdb/show/37636`, `/api/tmdb/trending`, and
  `/api/tmdb/search?q=breaking`: initial GET MISSes became HITs. API HEAD
  requests required their own warmup, then also returned HITs. Synthetic-cookie
  requests reused the cache. Responses retained `public, max-age=300` and JSON
  content types, without setting cookies.
- `/robots.txt`: the `SERankingBacklinksBot` exclusion is present in production.
- The production runtime error query for **10:08:26–10:13:10 UTC** returned no
  error-level logs. This short window is not a long-term reliability result.

The expanded `pnpm test:cache` now covers these API requests as well as public
show pages. It requires edge HITs when Vercel's cache header is present; against
a local production server it verifies the expected origin `s-maxage` instead.
`pnpm test:resources` also runs it against the fixture-backed production server.

Follow-up validation passed: `pnpm lint`, the expanded production
`BASE_URL=https://proximas-series.vercel.app pnpm test:cache`, and
`pnpm test:resources` with its production Webpack build and TypeScript check.
The fixture cache now includes trending data: **2,041 bytes across three entries**.

Vercel consumes `s-maxage` before sending the client response. These production
HITs verify cache reuse, **not the exact deployed TTL**. Confirm the one-day TTL
in dashboard request details. Dashboard browser access timed out during this
follow-up, so that check and the production usage totals remain open.

The first production log sample still contains cold show-page MISSes, including
successive IDs at roughly 13-second intervals between 10:10:52 and 10:11:57 UTC.
This resembles the earlier crawl pattern, but the connector output does not
include user agents, so it cannot identify the caller. A larger TTL would not
prevent these first-generation writes.

### Decisions still awaiting evidence

| Decision | Earliest useful review | Evidence required before changing it |
| --- | --- | --- |
| Enforce the crawler exclusion with WAF | 27 September after 10:10 UTC | Confirm `SERankingBacklinksBot` still crawls after a full day with the new robots file; scope the rule to that crawler |
| Extend caches to 48 hours | 27–28 September after 10:10 UTC | Compare equal production-only windows and establish that repeated revalidation, rather than cold MISSes, is a material remaining cost |
| Split the homepage into public and personal sections | After collecting route-level usage | Measure `/` function invocations and active CPU; estimate the saving against the extra authenticated request and refactor |
| Change build/deployment policy | No change indicated | No scheduled rebuild or refresh process exists in this repository |

Use **27 September 10:10 UTC** for the first complete 24-hour post-deploy window,
or **28 September 10:10 UTC** for 48 hours. Preserve the corresponding pre-deploy
production baseline and separate preview usage. Keep the 24-hour policy until
that comparison supports a further change. No automatic follow-up was scheduled.

## Verification and rollout

`pnpm test:resources` originally failed on the actual production response policy
`s-maxage=3600`. The revised policy is checked against `s-maxage=86400` using a
real Next.js production build and local server, with only external providers
replaced by fixtures. The test also inspects persisted cache files to reject raw
unused provider fields, exercises API/page reuse and malformed IDs, and advances
the server clock past expiry while simulating a TMDB outage.

Validation passed: `pnpm lint`, the normal `pnpm build` (Turbopack), and
`pnpm test:resources` (production Webpack build plus HTTP/cache checks). The
fixture's detail and season cache entries totaled 1,599 bytes; this is a
regression budget, not a measurement of production payload sizes. A browser
check advanced the client date by one day and confirmed that “Hoy” changed to
“Emitido” without a network request. Temporary clock overrides were restored.

| Verification layer | Result | Limit |
| --- | --- | --- |
| Existing production | Cache HITs and crawler-triggered cold/stale requests observed | Baseline behavior, before this fix |
| Lint and normal production build | Passed | Does not measure deployed Vercel usage |
| Production cache regression | Passed, including expiry and provider outage | External TMDB/Fonts use fixtures |
| Browser date rollover | “Hoy” became “Emitido” with no request | Local fixture page |
| New production deployment and cache reuse | Passed on merge commit `aaeecf3` | Fresh-entry dashboard TTL still unverified |
| Production resource totals and crawler response | Pending | Compare production-only 24–48-hour windows after deployment |

Local results do not measure Vercel billing. Production CDN reuse was checked
above; retain this checklist for subsequent deployments and the usage review:

1. Run `BASE_URL=https://proximas-series.vercel.app pnpm test:cache`.
2. In request details, confirm a fresh show entry has a one-day TTL, repeated
   visits are HITs, and public JSON APIs become HITs without setting cookies.
3. Compare equal **production-only** 24–48-hour windows: ISR write bytes/units,
   time-based revalidations, function invocations/active CPU, and edge requests.
   The original screenshot includes all environments; preview and production
   totals should be separated before comparing.
4. Inspect cold MISSes separately. If they dominate, extending the lifetime again
   is less useful than reducing unwanted crawling. Never purge all caches as a
   cost fix: the ensuing cold traffic needs to regenerate them.

References: [Vercel ISR usage and optimization](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing),
[Vercel CDN cache headers](https://vercel.com/docs/caching/cache-control-headers),
[Next.js ISR](https://nextjs.org/docs/app/guides/incremental-static-regeneration),
[SERankingBacklinksBot documentation](https://help.seranking.com/hc/en-us/articles/23020353159964-SERankingBacklinksBot-Crawler).
