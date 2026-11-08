# CrawlPilot — Real Solution Plan

> Created: 2026-11-08. Turning the simulated "indexing engine" into an honest, API-backed submission service.
> **Phases 0–4 code complete** — Phase 3 adds the durable `SubmissionJob` queue, Phase 4 adds the real site audit + AI crawler readiness. Phase 1/2 need user-hosted key file / service-account Owner access. Phase 5 (commerce honesty) is planned.

**Sach pehle:** koi service Google indexing guarantee nahi kar sakti. Real product = URL submission + per-engine acceptance tracking + status monitoring.

---

## Reality Matrix — which engines can be real

| Engine | Real API | Plan | Effort |
|---|---|---|---|
| Bing | IndexNow + Webmaster API | Real submission | Low |
| Yandex | IndexNow member | Real submission | Low (same call) |
| Seznam / Naver | IndexNow members | Real submission | Low (same call) |
| Google | Indexing API (JobPosting/Live only) + Search Console API (sitemap submit, URL Inspection) | Real submission for eligible URLs + real "indexed?" status | Medium |
| DuckDuckGo | None (uses Bing index) | Show "via Bing", no separate submission | Low |
| Baidu / Apple / Pinterest / CommonCrawl | No public submission API | Removed from UI (Phase 0) | Done |
| OpenAI / Anthropic | No submission API (robots.txt/sitemaps) | Convert to "AI crawler readiness audit" | Medium |

---

## Phase 0 — Truth & Safety ✅ COMPLETE (2026-11-08)

- [x] **Real status pipeline** — `queued → processing → submitted / partial / failed`; status is only finalized after actual engine responses.
  - *Pehle:* records `Delivered` hote hi ban jate the (results se pehle). *Ab:* `queued` par bante hain, background worker real responses ke baad `submitted/partial/failed` set karta hai (`src/lib/submitDiscovery.js`).
- [x] **Per-engine results stored** — `signalingResults.engines[] = { engine, ok, httpStatus, responseTime, error }`.
  - *Pehle:* sirf aggregate counts. *Ab:* har engine ka HTTP status + timing + error DB me.
- [x] **Fake console logs removed** — random user-agents, random delays, fabricated "HEADER/UA/SIGNAL" lines deleted.
  - *Pehle:* client fabricated logs. *Ab:* logs sirf stored results se (`buildLogsFromRecord`), submission ke baad 3s polling se real outcomes.
- [x] **Web 2.0 "authority links" removed** — 14 hardcoded redirect templates (fake feature) deleted.
- [x] **Fake tracker script removed** — `bot-tracker.crawlpilot.io/v1/track.js` claim deleted (service exists nahi karti).
- [x] **Dead engines removed** — UI me sirf Google + Bing; server `botUserAgents` bhi trim; deprecated Google/Bing sitemap ping endpoints removed.
- [x] **Fake toggles removed** — "Signal Intensity" aur "Auto-Ping" (server par koi asar nahi tha) delete.
- [x] **Real metrics** — `successRate` ab real `submitted / total`; `delivered` key hat gayi; stats return `accepted/submitted/partial/failed/pending`.
- [x] **Fake dashboards cleaned** — "1M+ URLs Indexed", "99.9% Bot Delivery", "GLOBAL-EDGE-1", "SIGNALS DISPATCHED", "INDEXING PINGED", fabricated activity/log modals sab remove.
- [x] **Honest copy** — hero, features, FAQ, pricing features, privacy policy updated to submission + status-tracking language.
- **Accept:** `grep -rn "1M+\|99.9%\|bot-tracker.crawlpilot.io\|Web 2.0\|GLOBAL-EDGE-1\|INDEXING PINGED\|SIGNALS DISPATCHED" src` → zero matches; build clean.

### Phase 0 files touched
`src/lib/submitDiscovery.js`, `src/lib/adminData.js`, `src/lib/botSignals.js`, `src/lib/realtime.js`,
`src/app/api/user/stats/route.js`,
`src/app/panel/indexing/page.js`, `src/app/panel/overview/page.js`, `src/app/panel/billing/page.js`,
`src/app/panel/api/page.js`, `src/app/admin/users/page.js`, `src/app/api-docs/page.js`,
`src/app/page.js`, `src/app/privacy-policy/page.js`

---

## Phase 1 — IndexNow ✅ CODE COMPLETE (2026-11-08)

- [x] Per-user IndexNow key — `User.indexNowKey` (32-char hex, unique), generated on first visit to `/panel/api`, rotate-able (`GET/POST /api/user/indexnow`).
- [x] Key-file verification — `verifyIndexNowKey()` fetches `https://<host>/<key>.txt` and checks the key is present; result surfaced in the UI (`POST /api/user/indexnow/verify`).
- [x] Real submission — `POST https://api.indexnow.org/indexnow` with `{host, key, keyLocation, urlList}` per host (URLs grouped by hostname, max 10,000/request), one retry on 429/5xx, real status stored (200/202 accepted; 400/403/422/429 with reasons).
- [x] Per-URL + per-engine records — `signalingResults.engines[]` entries now carry `method` (`indexnow` / `google-indexing-api` / `http-check`), `httpStatus`, `responseTime`, `error`.
- [x] Credits refunded when no engine accepts anything (fully failed records).
- [x] Google per-URL API results stored (was only an aggregate status before).
- **User-side step (required for 200 OK):** host `https://<your-domain>/<key>.txt` containing the key; then verify in `/panel/api` and submit with Bing selected. Without the key file, IndexNow correctly returns 403 and the UI shows the exact reason + key location.
- **Accept (live):** real 403/422 response recorded for unverified domains — verified on 2026-11-08. A 200/202 requires the user's own domain hosting the key file (cannot be tested on example.com).

## Phase 2 — Google (Search Console) ✅ CODE COMPLETE (2026-11-08)

- [x] Service-account flow reused (same JSON as the Indexing API, scopes: `indexing` + `webmasters`).
- [x] **Property discovery** — `GET /api/indexing/google/properties` lists Search Console properties the service account can access; `matchProperty()` prefers `https://host/`, then `http://host/`, then `sc-domain:host` (incl. parent-domain matches).
- [x] **Sitemap submit** — `POST /api/indexing/google/sitemap` → `webmasters.sitemaps.submit` + `sitemaps.list` read-back (lastSubmitted, pending, warnings/errors). UI button in the sitemap tab.
- [x] **URL Inspection** — `POST /api/indexing/google/inspect` → `searchconsole.urlInspection.index.inspect`; result (verdict, coverageState, lastCrawlTime, canonical, robots state) cached on `IndexingResult.indexStatus` (+ `indexStatusCheckedAt`); verdict badge + "Google index status" button per record.
- [x] **Honest errors** — 403 (service account not an Owner) and invalid-credential errors are mapped to actionable messages; quota 429 surfaced.
- **User-side prerequisites:** save the service account JSON in My profile **and** add that service account as Owner in Search Console for the property. Then "Check Search Console access" shows the properties.
- **Accept (live):** missing-config and invalid-credential paths verified 2026-11-08; a real 200 (sitemap submitted / inspected) requires the user's own service account + property.

## Phase 3 — Durable job queue ✅ CODE COMPLETE (2026-11-08)

- [x] **`SubmissionJob` table** — `pending | processing | done | dead`, attempts, `maxAttempts`, backoff via `availableAt`, `lockedAt`, `payload` JSON (`{records, engines}`); RLS enabled; indexes on `(status, availableAt)` and `userId`.
- [x] **DB-backed worker** — `src/lib/jobQueue.js`: atomic claim (`updateMany` pending→processing), `processPendingJobs()` (limit 20), exponential backoff (1m, 2m, 4m… capped 30m), dead-letter after 3 attempts.
- [x] **Dead-letter safety** — records still queued/processing are marked failed and credits refunded exactly once; already-final records are untouched.
- [x] **Crash recovery** — `requeueStaleJobs()` returns jobs stuck in `processing` (>10 min) to `pending`, or dead-letters them when retries are exhausted.
- [x] **Enqueue in the same transaction** as the IndexingResult rows + balance decrement → a job always exists if credits were charged.
- [x] **Immediate kick + cron fallback** — `submitDiscovery` kicks `processPendingJobs()` without blocking the response; the cron endpoint guarantees eventual processing. InsForge fallback (Prisma down) processes inline.
- [x] **Cron endpoint** — `GET/POST /api/cron/process-jobs`, authorized by `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret`), Vercel's `x-vercel-cron` header when no secret is set. `CRON_SECRET` added to `.env`/`.env.local`.
- [x] **Observability** — `/api/user/stats` returns `queuedJobs`; the IN PROGRESS card shows queue depth.
- **Activation (one-time, after deploy):**
  - *Vercel Pro:* add `{ "crons": [{ "path": "/api/cron/process-jobs", "schedule": "* * * * *" }] }` to `vercel.json` (Hobby plan only allows daily crons, so it is intentionally not committed).
  - *Any plan (recommended):* InsForge schedule → `npx -y @insforge/cli schedules create` with URL `https://<your-domain>/api/cron/process-jobs`, every minute, header `x-cron-secret: <CRON_SECRET>`.
  - Set `CRON_SECRET` in the deployment env vars too.
- **Accept (live):** submitted batch created a job and completed it (`done`), cron auth returns 401 without the secret, stale `processing` jobs are requeued, and exhausted jobs are dead-lettered — verified 2026-11-08 against the local backend.

## Phase 4 — Real value-adds ✅ CODE COMPLETE (2026-11-08)

- [x] **Site audit crawler** — `POST /api/audit` (1–20 URLs, concurrency 3): real server-side fetch with SSRF guard, redirect chain (max 3), response time, HTTP status, title, meta description, canonical (+ match check), meta/X-Robots noindex·nofollow, H1 count, lang, viewport, content type, page size. New `/panel/audit` page.
- [x] **AI crawler readiness** — `POST /api/audit/ai-readiness`: real `robots.txt` parsing (user-agent groups, longest-match Allow/Disallow for `/`), sitemap URLs from robots.txt, homepage reachability; per-bot Allowed/Blocked for GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, anthropic-ai, Google-Extended, CCBot, PerplexityBot, Bytespider.
- [ ] **Bot visit analytics** — intentionally NOT built without real access-log/analytics integration (would be simulated data again). Phase 4+ candidate.
- **Accept (live):** `example.com` audited (HTTP 200, title detected), blocked URL rejected (SSRF), AI readiness read from the real robots.txt — verified 2026-11-08.

## Phase 5 — Commerce & operations (2–3 din)

- [ ] Real Stripe checkout (InsForge payments) ya manual top-up clearly manual
- [ ] Support form → real email integration ya honest disabled (abhi disabled hai)
- [ ] Notifications → real email ya remove
- [ ] Admin activity feed from submission events

---

## Architecture (target)

```
src/lib/engines/indexnow.js   → real IndexNow submission
src/lib/engines/google.js     → Indexing API + Search Console (sitemap + inspection)
src/lib/engines/httpCheck.js  → reachability check (current botSignals)
src/lib/submitDiscovery.js    → enqueue jobs (after Phase 3)
EngineSubmission model        → per-engine status rows
Balance                       → charged only on accepted submissions
```

**Estimated Phase 1–3 (working real product): ~10–15 din.**
