# Vercel usage review — 28 September 2026

## Result and current status

**This project accounts for 99.9% of the team's ISR write units.** The rolling
30-day total is already above the Hobby allowance. Image transformations are
also above their allowance, and team CPU is close to its limit. The allowance
belongs to the team, so this project cannot safely consume the entire quota.

The earlier cache fixes are live and working. At audit time, production was commit
`2cd726100d906f8f449e24032999ea4540cde8f6`, deployment
`dpl_8G9NXvX9dhH8qfXx1gfaocU1ny2A`, deployed on 26 September. The remaining
observed source of pressure is crawlers visiting thousands of previously
uncached `/serie/[id]` pages. Longer cache lifetimes do not prevent those writes.

Changes from this review:

- Set `User-agent: *` with `Disallow: /` in `src/app/robots.txt`, asking all
  cooperative crawlers, including Google and Bing, to stop crawling the site.
  The owner accepts losing search discovery to keep this personal project cheap.
  The global policy also covers the observed `meta-webindexer` identity, which
  was not covered by the previous `meta-externalagent` exclusion.
- Added inherited `noindex, nofollow` page metadata. Both source changes still
  need deployment. A crawler blocked by robots.txt cannot read this metadata;
  existing search listings can remain. The immediate objective is lower crawl
  traffic, not guaranteed removal from search results.
- Saved two **unpublished Log rules** in Vercel, scoped to `/serie/` and either
  `SERankingBacklinksBot` or `meta-webindexer`. They neither block traffic nor
  reduce usage in their current state. The enforcement rollout is below.
- Normal browser access remains available. No generic user-agent firewall block,
  paid feature, cache purge, cron, or extra compute service was introduced.

Usage is **not yet confirmed under control**. Historical totals will remain
high until older usage leaves the reporting window, and fresh measurements are
needed after enforcement. The dashboard observations below are snapshots, not
an automatic quota limiter or alerting system.

## Resource inventory

Sources: [team usage](https://vercel.com/marcio-barrios-projects/~/usage),
[project usage](https://vercel.com/marcio-barrios-projects/proximas-series/usage),
and [ISR attribution](https://vercel.com/marcio-barrios-projects/~/usage/isr-writes?view=Count).
Read on 28 September around 10:20–10:35 Europe/Madrid. The selected rolling
window began 29 August; these usage totals include the selected project's
environments. Values were read across successive refreshes and are rounded
where the UI rounds them. ISR units and individual cache operations differ.

| Meter | Project | Team | Shared Hobby allowance | Assessment |
| --- | ---: | ---: | ---: | --- |
| ISR write units | 226,415 | 226,605 | 200,000 | Already over; this project dominates |
| Active CPU | 3h 45m | 3h 51m | 4h | Team at 96.6%; very little headroom |
| Fast Origin Transfer | 7.60 GB | 8.61 GB | 10 GB | Team at 86.1% |
| Image transformations | 7,744 | about 7,800 | 5,000 | Already over; image optimization is now disabled in source |
| Function invocations | 408,351 | 412,033 | 1,000,000 | Below limit; project contributes about 99% |
| Edge requests | 376,809 | 444,665 | 1,000,000 | Below limit |
| ISR read units | 45,196 | 172,412 | 1,000,000 | Below limit |
| Fast Data Transfer | 4.95 GB | 6.11 GB | 100 GB | Ample headroom |
| Provisioned memory | 20.9 GB-hours | 21.3 GB-hours | 360 GB-hours | Ample headroom |
| Image cache writes | 28,084 | about 28,000 | 100,000 | Below limit; rounded team display |
| Image cache reads | 770 | about 800 | 300,000 | Ample headroom |
| Web Analytics events | 19 | 574 | 50,000 | Negligible |
| Speed Insights data points | 0 | 29 | 10,000 | Negligible |
| Build execution time | 14m | about 1h | 100h | Not the current problem |

Project cron invocations, Blob and queue usage were zero in this window. The
repository has no scheduled refresh/rebuild. Project build CPU was 1h 24m; do not
confuse build CPU with the active function CPU quota above. No paid observability,
rate limiting, or plan upgrade is needed for the proposed custom rules.

The initial attribution chart showed 226,410 project write units, 183 from
`padelaso`, and 12 from `comprasostenible`, totaling 226,605 (99.91% attributable
to this project). The five-unit difference from the later project total is a
live refresh difference.

## Evidence after the previous fix

The complete **27 September local calendar day** in project usage showed roughly
30K ISR write units, 4K reads, 6m 23s CPU, 255.19 MB origin transfer, 96.87 MB data
transfer, 9.1K edge requests, and 6.4K function invocations. Image cache reads
and writes were zero. At a sustained 30K write units/day, 30 days would consume
about 900K units, far above the 200K allowance. This is a projection from one
day, not a forecast or a measured monthly reduction.

The **production-only last-12-hour** observability window, approximately
27 September 22:26–28 September 10:26 Europe/Madrid, showed:

- About 20K ISR write units and 3.9K read units, with 580 time-based
  revalidations and zero tag revalidations. `/serie/[id]` was the only route with
  nonzero ISR activity: about 8.2K write operations across 4.6K unique paths.
- About 4.4K show-page function invocations using four minutes of CPU. `/` had
  only 13 invocations and 840 ms CPU; `/mis-series` had one invocation and 80 ms.
  A homepage architecture refactor would not address this measured bottleneck.
- The edge-request user-agent breakdown listed `meta-webindexer` at 2.2K
  requests (33% cached), `seranking-backlinks` at 424 (30.4%), `bingbot` at 210
  (34.3%), and `amazonbot` at 111 (9.9%). These are classified request counts,
  not crawler shares of ISR units. The table does not identify all traffic.

Fresh production request details confirm **one-day TTLs**, cold cache MISSes,
function invocations, and ISR updates on the current deployment:

| UTC time, 28 September | Path | User-agent token | Request ID |
| --- | --- | --- | --- |
| 08:05:57.551 | `/serie/271855` | `SERankingBacklinksBot/1.0` | `qpb5s-1790582757551-5fcc18dcb616` |
| 07:58:32.095 | `/serie/6875` | `meta-webindexer/1.1` | `4xqjc-1790582312095-58e3fd400b44` |
| 08:05:25.428 | `/serie/12712` | `bingbot/2.0` | `2krt2-1790582725428-8097ac0395ba` |

SE Ranking was still generating new pages about 46 hours after its robots
exclusion deployed. Asking crawlers to stop through robots.txt alone is
therefore insufficient. Samples establish the mechanism and callers; they do
not establish how many historical peaks or write units each bot caused.

The existing `BASE_URL=https://proximas-series.vercel.app pnpm test:cache`
checks passed on 28 September: HTML, HEAD, RSC, synthetic-cookie and Bingbot
show-page requests reused the shared cache. Show, trending and search JSON APIs
also returned shared HITs for GET, HEAD and synthetic-cookie requests, retained
the five-minute browser policy and did not set cookies. This verifies repeat
request reuse; dashboard request details independently verify the page TTL.

## Firewall rollout

The [project firewall rules](https://vercel.com/marcio-barrios-projects/proximas-series/firewall/rules)
contained two enabled drafts at audit time, both with action **Log**:

| Rule | Conditions joined with AND | ID |
| --- | --- | --- |
| Observe SE Ranking show crawler | Request Path starts with `/serie/`; User Agent contains `SERankingBacklinksBot` | `rule_observe_se_ranking_show_crawler_epclP7` |
| Observe Meta show crawler | Request Path starts with `/serie/`; User Agent contains `meta-webindexer` | `rule_observe_meta_show_crawler_77r7Pl` |

Neither was published during the audit. They use two of Hobby's three custom
rule slots. Custom rules are available free; the intended eventual **Deny** action runs
before the application, avoiding the matching ISR/function work. Vercel also
excludes WAF-mitigated requests from CDN request and transfer billing. **Log
does not produce these savings.** See [WAF usage and pricing](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing).

1. The owner reviews the two pending changes and publishes them in the dashboard.
2. The owner reviews matching traffic for
   [SE Ranking](https://vercel.com/marcio-barrios-projects/proximas-series/firewall/traffic?filter=rule_observe_se_ranking_show_crawler_epclP7)
   and [Meta](https://vercel.com/marcio-barrios-projects/proximas-series/firewall/traffic?filter=rule_observe_meta_show_crawler_77r7Pl).
   Confirm they match those crawlers on show pages and no desired clients.
3. Stage Deny with an additional `environment = preview` condition, publish,
   and verify on a preview deployment. Preserve the full path and UA match.
   Test a normal browser and both named crawler UAs against the same show URL;
   browsers should work and the scoped bots should be denied. Removing the
   environment restriction is a separate production rollout.
4. After the owner accepts the match data and preview behavior, stage Deny
   for production and have the owner publish. Verify the production blocks in
   the dashboard and that ordinary users and sign-in still work. Search crawling
   is intentionally disallowed by the separate site-wide robots policy.
5. Compare complete production-only windows after enforcement. If unexpected
   clients match, switch the affected rule back to Log or disable it and publish.

The Vercel firewall skill used for this review requires owner publishing and
Log → traffic review → preview enforcement → production enforcement. No live
firewall protection was disabled or enforcement published during this review.
UA matching is a targeted reduction, not protection against a crawler changing
its identity. The third free rule remains available if evidence warrants another
specific crawler policy. The site-wide robots policy asks Google/Bing to stop
crawling as well; the targeted WAF rules address observed crawlers that may
continue requesting pages despite that policy.

## Crawling and indexing policy

This personal project prioritizes lower usage over search visibility. Its
robots.txt disallows the entire site for every crawler, with no more permissive
agent-specific groups. Root layout metadata marks pages `noindex, nofollow`
without adding a request-time bot check or changing their cache lifetimes.

These mechanisms have different limits. robots.txt reduces requests only from
cooperative crawlers. It is neither an access control nor a guarantee that URLs
disappear from search: an engine can retain or discover a URL without fetching
it. The noindex directive applies only when a crawler actually fetches the page;
a crawler obeying `Disallow: /` cannot see it. Immediate deindexing would require
a separate removal process and is not part of this resource-control change.
See [Google's robots documentation](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
and [noindex documentation](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

After deployment, confirm `/robots.txt` serves the global exclusion, the rendered
pages contain the robots metadata, and ordinary browser navigation works. Allow
for crawlers refreshing their cached robots policy, then compare complete daily
usage windows. Persistent unwanted crawling still needs the WAF rollout above.

Validation after this policy change: `pnpm lint` and `pnpm test:resources` passed.
The latter includes a production Webpack build, TypeScript, and fixture-backed
HTTP checks for ordinary page access, daily cache reuse, API policies, and stale
page preservation during provider failure. It does not measure crawler compliance
or confirm deployment of the new robots policy.

## Operating budgets and acceptance criteria

These are **review thresholds**, not configured Vercel limits or alerts. They
reserve capacity for other projects and provide concrete success criteria.
Read the rolling totals alongside complete daily deltas; old usage expiring
must not be mistaken for a reduction in current traffic.

| Project meter | Target per complete day | 30-day equivalent | Response if exceeded |
| --- | ---: | ---: | --- |
| ISR write units | at most 5,000 | 150,000 | Inspect cold paths and crawler matches first |
| Active CPU | at most 3 minutes | 90 minutes | Check route invocations and cold ISR generation |
| Origin transfer | at most 100 MB | about 3 GB | Check ISR/API misses and payload size |
| Function invocations | at most 10,000 | 300,000 | Inspect routes, bot traffic and cache reuse |
| Edge requests | at most 10,000 | 300,000 | Check bot sources and unwanted asset requests |
| New image transformations | zero | zero | Check for `/_next/image` traffic, old URLs and config regression |

After production enforcement, compare two complete 24-hour windows and a
seven-day average against these budgets, plus the team's remaining allowance.
The team is already over the ISR/image allowance, so these targets cannot restore
the current rolling quota immediately. Keep image optimization disabled and use
TMDB CDN image sizes. Do not flush caches or create a warming job: both can add
the writes being reduced.

If writes remain above budget, distinguish new-page crawling from repeated
expiry before changing cache lifetimes. A 48-hour TTL only helps the latter.
If search crawlers continue fetching pages after refreshing robots.txt, inspect
their requests and consider a targeted WAF rule. Search indexing is not required;
a public unbounded catalog still cannot guarantee a fixed usage ceiling under
arbitrary traffic.

[Hobby documentation](https://vercel.com/docs/plans/hobby) lists the included
resources and notes that exceeding some free limits can make a feature
unavailable until usage resets. Spend Management is not available on Hobby;
it is not a project-level hard quota control. No scheduled monitor was created.
