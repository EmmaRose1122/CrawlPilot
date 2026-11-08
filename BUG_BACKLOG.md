# CrawlPilot — Bug Backlog

> Created: 2026-11-08. Static code review of the full repo (`src/`, `prisma/`, root scripts, `.env`).
> **All 21 items fixed on 2026-11-08** (see per-item `pehle kya tha → ab kya`). Item 1.2 additionally needs a manual credential rotation (below).
> **Note on tooling:** `node_modules` and `.next` were not present in this folder, so `npm run lint` / `npm run build` could NOT be run here. All fixes were verified by code read + `node --check` / esbuild parse of every edited file (all pass). Items marked `[R]` still need a live runtime check on your side (commands in item 2.2).

Legend:
- **[V]** verified by reading the exact code lines
- **[S]** verified by schema/migration mismatch (two files compared)
- **[R]** needs runtime confirmation (depends on deployed DB state or 3rd-party SDK shape)

---

## Phase 1 — CRITICAL: Security (ALL DONE)

### 1.1 [V] Hardcoded master admin backdoor (email + password in source)
- [x] **Severity:** Critical | **Category:** Auth | **File:** [src/auth.js:9-10](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/auth.js#L9)
- **Symptom:** Anyone with repo access could log in as ADMIN with the hardcoded fallback credentials (email + literal password in source; the fallback worked when `ADMIN_PASSWORD` env was missing).
- **Root cause:** Literal fallback master credential + a session callback that force-promoted that email to ADMIN on every login.
- **pehle kya tha → ab kya:** Recovery login now only activates when `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars are explicitly set (no code fallbacks); the self-healing force-promotion block in the session callback was removed entirely. The email remains only as the public support contact in UI links — the password no longer exists in source.
- **Verify:** `grep -r "ADMIN_PASSWORD ||" src/` → no matches. With env unset, the recovery path is inert; with env set, demote the role in DB and confirm it stays demoted.

### 1.2 [V] Live secrets shipped in `.env` (gitignore rule disabled)
- [x] **Severity:** Critical | **Category:** Secrets | **File:** [.gitignore](file:///C:/Users/IK/Downloads/CrawlPilot-main/.gitignore)
- **Symptom:** `.env` holds the live Postgres password, `AUTH_SECRET`, Google OAuth client secret — and the env ignore rule was commented out.
- **Root cause:** `# .env*` was commented in `.gitignore`.
- **pehle kya tha → ab kya:** `.gitignore` now ignores `.env`, `.env.*` (except `.env.example`), and the `scratch/` folder. **Manual step still needed by you:** rotate `DATABASE_URL` password, `AUTH_SECRET`, `AUTH_GOOGLE_SECRET` at their providers, since the values may already be exposed anywhere the repo was shared.
- **Verify:** `git check-ignore .env` succeeds after `git init`/push setup; old credentials rejected at their providers.

### 1.3 [V] SSRF — unauthenticated sitemap fetcher
- [x] **Severity:** Critical | **Category:** SSRF | **File:** [src/app/api/indexing/sitemap/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/indexing/sitemap/route.js)
- **Symptom:** `POST /api/indexing/sitemap` had no auth and server-fetched any URL (metadata endpoints, localhost, intranet), recursing into child sitemaps.
- **Root cause:** No session check, no URL validation, no timeout.
- **pehle kya tha → ab kya:** Route now requires a session; all URLs (root + child sitemaps) go through the new [src/lib/urlSafety.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/urlSafety.js) guard (http/https only, private/loopback/link-local/reserved IP rejection incl. DNS-resolved addresses, `localhost`/`.local`/`.internal` rejection, 8s timeout, max 3 redirects, 10MB body cap).
- **Verify:** Unauthenticated POST → 401. POST with `http://127.0.0.1:3000/...` → 400 "Blocked URL".

### 1.4 [V] SSRF — bot signaler fetches arbitrary user strings
- [x] **Severity:** High | **Category:** SSRF | **File:** [src/lib/submitDiscovery.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/submitDiscovery.js)
- **Symptom:** Discover accepted any trimmed string as a URL; the background worker `fetch()`ed them from the server.
- **Root cause:** No URL validation before fetching.
- **pehle kya tha → ab kya:** The submission pipeline (extracted into `src/lib/submitDiscovery.js`) validates every URL with `validatePublicHttpUrl`; blocked entries are returned to the client as `skippedUrls` with reasons instead of being silently processed; submission is rejected if nothing valid remains.
- **Verify:** Submit `http://169.254.169.254/` → response lists it in `skippedUrls`; a normal https URL still processes.

### 1.5 [V] IDOR — any user can edit any other user's indexing result ("Add Links")
- [x] **Severity:** High | **Category:** IDOR | **File:** [src/app/api/indexing/links/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/indexing/links/route.js)
- **Symptom:** `resultId` was looked up without ownership — any user with `canAddLinks` could modify/read others' results.
- **Root cause:** Missing `userId` filter.
- **pehle kya tha → ab kya:** POST and GET now filter by `userId: session.user.id` on read and write (`findFirst`/`updateMany`); foreign results return 404.
- **Verify:** User B calls POST on User A's resultId → 404; User A's own call still works.

### 1.6 [V] Hardcoded shared API token in the client bundle
- [x] **Severity:** High | **Category:** Secrets | **File:** [src/app/panel/api/page.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/api/page.js)
- **Symptom:** Every user was shown the same literal token `463d3d...`; the advertised REST API (`api.crawlpilot.io`) did not exist; reset button did nothing.
- **Root cause:** Static string in a client component; no token storage; no API.
- **pehle kya tha → ab kya:** Per-user API tokens are now real: `User.apiToken` column (stores a SHA-256 hash, never the raw value), `GET/POST /api/user/apitoken` (create/rotate; raw token shown once), token auth via `token` query param or `Authorization: Bearer` ([src/lib/apiAuth.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/apiAuth.js)), and working endpoints `GET /api/v1/balance`, `GET /api/v1/index`, `POST /api/v1/index/bulk` (1,000 URL cap), `GET /api/v1/index/status`. Panel page fetches the real token with reveal/copy/rotate; api-docs page now documents the same-origin `/api/v1` endpoints.
- **Verify:** Two users see different tokens; `curl "<origin>/api/v1/balance?token=..."` returns the right balance; rotation breaks the old token immediately.

---

## Phase 2 — HIGH: Broken features / data integrity (ALL DONE)

### 2.1 [S] "Add Links" feature is 100% broken — `links` column does not exist
- [x] **Severity:** High | **Category:** Schema drift | **File:** [prisma/schema.prisma](file:///C:/Users/IK/Downloads/CrawlPilot-main/prisma/schema.prisma)
- **Symptom:** Every "Add Links" call returned 500; the route read/wrote a column that existed in neither schema nor migrations.
- **Root cause:** Route written against a never-added `links` column.
- **pehle kya tha → ab kya:** `links String? @db.Text` added to `IndexingResult` in the schema, included in the sync migration (2.2). The route itself already reads/writes it (ownership-guarded since 1.5).
- **Verify:** After running the 2.2 migration + `prisma generate`, POST/GET links round-trips successfully.

### 2.2 [S] Migrations are out of sync with schema — several features fail on a migrated DB
- [x] **Severity:** High | **Category:** Schema drift | **Files:** [prisma/migrations/20261108000000_sync_schema/migration.sql](file:///C:/Users/IK/Downloads/CrawlPilot-main/prisma/migrations/20261108000000_sync_schema/migration.sql)
- **Symptom (was certain in files):** Migrations never created `User.referralCode/referredBy/googleIndexingConfig/apiToken`, `IndexingResult.signalingResults/updatedAt/links`, and the `Task`/`TaskSubmission` tables → signup, profile config save, task flows and signaling storage would fail on a migrate-built DB.
- **Root cause:** `schema.prisma` evolved without migration files.
- **pehle kya tha → ab kya:** New migration `20261108000000_sync_schema` adds all missing columns (with unique indexes for `apiToken`/`referralCode`) and the `Task`/`TaskSubmission` tables with FKs.
- **Verify (runtime, needs you):** `npm install` → `npx prisma generate` → `npx prisma migrate deploy` (if the InsForge-hosted DB was created via `db push` and already has these columns, `migrate deploy` may complain — in that case run `npx prisma migrate resolve --applied 20261108000000_sync_schema` to mark it applied, since the columns already exist). Then signup/task-submit/profile-save all succeed.

### 2.3 [R] Rewards Hub split across two backends — submissions invisible to the task list
- [x] **Severity:** High | **Category:** Cross-DB consistency | **Files:** [src/app/api/tasks/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/tasks/route.js), [src/app/api/admin/tasks/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/admin/tasks/route.js)
- **Symptom:** Submissions/approvals were written to Prisma while lists were read InsForge-first → status never changed in the UI unless InsForge was down.
- **Root cause:** Reads preferred InsForge, writes only hit Prisma.
- **pehle kya tha → ab kya:** Task lists (user + admin) are now Prisma-first with InsForge as fallback (`withInsforgeFallback`), matching the write path. Approval is one atomic transaction: reward granted exactly once, only on the pending→approved transition, and status values are validated (`approved`/`rejected` only).
- **Verify (runtime):** Submit proof → Earn page shows "Pending"; approve → user sees "Completed" and balance +reward; double-approve grants reward once.

### 2.4 [V] Balance overspend race — concurrent submissions bypass the credit check
- [x] **Severity:** High | **Category:** Race condition | **File:** [src/lib/submitDiscovery.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/submitDiscovery.js)
- **Symptom:** Read-balance-then-write-absolute allowed parallel submissions to overspend (each charged from the same stale snapshot).
- **Root cause:** Non-atomic read-modify-write.
- **pehle kya tha → ab kya:** Record creation + balance charge now run in one Prisma transaction with a conditional `updateMany({ balance: { gte: cost } }, { decrement: cost })`; if the condition fails the transaction rolls back and returns `INSUFFICIENT_CREDITS`. If Prisma is unreachable it degrades to the previous InsForge path (logged).
- **Verify (runtime):** Balance = cost for exactly 1 submission; fire 5 in parallel → exactly 1 succeeds, final balance 0.

### 2.5 [V] Admin top-up accepts garbage amounts (NaN / negative / huge)
- [x] **Severity:** Medium | **Category:** Input validation | **File:** [src/app/api/admin/users/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/admin/users/route.js)
- **Symptom:** `parseInt("")` / negatives could silently corrupt a user's balance.
- **Root cause:** No validation before the increment.
- **pehle kya tha → ab kya:** Amount is validated (`Number.isFinite`, `> 0`, integer-truncated); invalid input returns 400.
- **Verify:** POST `{"userId": "...", "amount": "-100"}` → 400; `"500"` works.

---

## Phase 3 — MEDIUM: Runtime robustness (ALL DONE)

### 3.1 [V] `useRealTimeUpdates` uses React hooks without importing React
- [x] **Severity:** Medium | **Category:** Runtime crash (latent) | **File:** [src/lib/realtime.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/realtime.js)
- **Symptom:** First consumer of the hook would throw `ReferenceError`.
- **Root cause:** Missing React import.
- **pehle kya tha → ab kya:** Added `import { useState, useEffect } from 'react'`.
- **Verify:** Build compiles the module; hook importable.

### 3.2 [R] InsForge realtime API shape unverified — panel can crash on mount
- [x] **Severity:** Medium | **Category:** SDK compatibility | **File:** [src/app/panel/indexing/page.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/indexing/page.js)
- **Symptom:** `RealTimeManager.start()` ran unguarded in a mount effect — an SDK mismatch could unmount the whole panel.
- **Root cause:** No try/catch; fallback polling depended on the manager existing.
- **pehle kya tha → ab kya:** `manager.start(callbacks)` is wrapped in try/catch (logs a warning and continues); fallback polling now runs every 30s whenever the live feed is on, skipping only when `isConnected()` returns true — so data stays fresh even if realtime is broken.
- **Verify (runtime):** Block WebSockets in devtools on `/panel/indexing` → page renders, polls update data, console shows a warning not a crash.

### 3.3 [V] Sitemap fetch has no timeout and unbounded redirects
- [x] **Severity:** Medium | **Category:** DoS/robustness | **File:** [src/lib/urlSafety.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/lib/urlSafety.js)
- **Symptom:** Slow/streaming URLs could hang the function; redirect loops wasted time.
- **Root cause:** No AbortController, redirect policy, or size cap.
- **pehle kya tha → ab kya:** `fetchPublicUrl` enforces 8s timeout (AbortController), manual redirects capped at 3 hops (each re-validated by the SSRF guard), and a 10MB body cap.
- **Verify:** Point the sitemap endpoint at a slow endpoint → errors in ~8s instead of hanging.

### 3.4 [V] Admin recovery path can mint a session with a fake user id (`admin-recovery`)
- [x] **Severity:** Medium | **Category:** Auth edge case | **File:** [src/auth.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/auth.js)
- **Symptom:** When the DB upsert timed out (already observed in `scratch/next-dev.err.log`), a synthetic id flowed into the JWT → "User not found" on every API call.
- **Root cause:** Synthetic fallback user returned from `authorize()`.
- **pehle kya tha → ab kya:** The fallback user object is gone; when the recovery upsert fails, `authorize()` returns `null` — the login fails cleanly with the standard "Invalid credentials or database connection failed" message instead of a half-working session.
- **Verify:** Force a DB timeout during admin login → clean login error, no broken session.

---

## Phase 4 — LOW: UI, cosmetic, dead code, hygiene (ALL DONE)

### 4.1 [V] Bot-log modal always fakes success ("200 OK") regardless of real results
- [x] **File:** [src/app/panel/indexing/page.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/indexing/page.js)
- **pehle kya tha → ab kya:** The modal now renders the real stored `signalingResults` (success/total counts, success rate, Google API status); if results are still pending it says so instead of inventing a 200 OK.

### 4.2 [V] Fake/dead features that look live
- [x] **Files:** [profile page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/profile/page.js), [profile route](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/user/profile/route.js), [support page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/support/page.js), [admin settings page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/admin/settings/page.js), [api-docs page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api-docs/page.js)
- **pehle kya tha → ab kya:** Profile name-save and password-change are now real (route verifies current password with bcrypt, enforces min 8 chars, handles Google-only accounts) with inline success/error messages. Support form is visually disabled with an honest "email support@crawlpilot.io" banner. Admin settings page carries a "read-only in this release" banner with controls disabled. API docs now document the real same-origin `/api/v1` endpoints (see 1.6). Payments page already showed an honest empty state — left as-is.

### 4.3 [V] Custom font never applied
- [x] **File:** [src/app/layout.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/layout.js)
- **pehle kya tha → ab kya:** Body now uses `var(--font-noto)` (the actual Noto Sans variable) instead of the undefined `var(--font-sans)`.

### 4.4 [V] Small UI typos/defects
- [x] **Files:** [signup page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/signup/page.js) (`width: '100'` → `'100%'`), [FAQAccordion](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/components/FAQAccordion.js) + [HomeClient](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/HomeClient.js) (`justifyContent: 'between'` → `'space-between'`), [admin users page](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/admin/users/page.js) (search input now filters the user table), [admin layout](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/admin/layout.js) (dead "Search records" box removed), [indexing panel](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/panel/indexing/page.js) (`res.time` → real `createdAt` timestamp).

### 4.5 [V] Dead helpers and scratch scripts with real data
- [x] **Files:** `scratch/` folder, [.gitignore](file:///C:/Users/IK/Downloads/CrawlPilot-main/.gitignore)
- **pehle kya tha → ab kya:** `cleanup-user.js`, `simulate-signup.js`, `rebrand.js` moved from the repo root into `scratch/` (now gitignored); the unused `processSingleUrl` function was removed from the indexing panel.

### 4.6 [V] Seed creates well-known default accounts
- [x] **File:** [prisma/seed.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/prisma/seed.js)
- **pehle kya tha → ab kya:** Seed now throws if `ADMIN_EMAIL`/`ADMIN_PASSWORD` are missing (no `admin123` defaults), and the `user@example.com`/`user123` demo account is gone.

### 4.7 [V] Hardcoded domain assumptions
- [x] **Files:** [src/app/robots.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/robots.js), [src/app/sitemap.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/sitemap.js)
- **pehle kya tha → ab kya:** Both now derive the base URL from `NEXTAUTH_URL` (set in `.env`) → `AUTH_URL` → `NEXT_PUBLIC_APP_URL` → the old default, instead of always emitting `crawl-pilot.vercel.app`.

### 4.8 [V] Signup validation gaps
- [x] **File:** [src/app/api/auth/signup/route.js](file:///C:/Users/IK/Downloads/CrawlPilot-main/src/app/api/auth/signup/route.js)
- **pehle kya tha → ab kya:** Email is now validated with a regex and normalized with `trim().toLowerCase()` (matching auth.js), password minimum is 8 chars, name is trimmed and required, and unexpected errors return a generic message instead of leaking Prisma `error.message` to the client.

---

## Remaining manual steps for you (outside code)
1. **Rotate credentials** (item 1.2): Postgres password in `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_SECRET` — treat the current values as exposed and regenerate at their providers, then update `.env`.
2. **DB migration** (item 2.2): on the server run `npm install`, `npx prisma generate`, `npx prisma migrate deploy` (or mark `20261108000000_sync_schema` as applied if the InsForge DB already has the columns via `db push`).
3. **Verify live** (items 1.6, 2.3, 2.4, 3.2 marked [R]): run the app and check token creation/rotation, the Earn-page approval flow, parallel submission charging, and the panel with realtime blocked.
