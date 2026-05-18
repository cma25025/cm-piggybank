# CM Piggybank — v1 Implementation Plan

**Status:** Draft v3 · post Eng review + outside voice
**Date:** May 2026
**Estimated duration:** ~14–19 working days sequential, ~11–15 with Lanes A/B/C parallelizing Phases 6/7/8

## 1. Context

- **PRD:** `~/Downloads/PigybankPRD.md` (v0.1)
- **Target-state mockup:** `~/Downloads/piggybankmockuptargetstate.html`
- **Scope path:** Path A (Spreadsheet-killer, slim ship, target-state-ready schema)
- **Strategic constraint:** zero ongoing cost during beta
- **Current repo state:** v0 prototype (single-user flat schema) will be **fully discarded**; `.git` history preserved
- **Code home:** GitHub `cma25025/cm-piggybank`, Vercel `cm-piggybank` (`prj_ivgoHOYF2cSqYazxECU7Th0SBvQ7`), Supabase `supabase-fulvous-arrow` (`scuxpypcxwlyyfgovncf`) — all linked

This plan replaces the v0 codebase entirely. Sequenced for **shortest-path-to-beta** — each phase produces something a beta caretaker could use, so the build can stop early if signal demands a pivot.

## 2. Locked decisions

### Product (from CEO review)
| # | Decision |
|---|---|
| C1 | Default split: 60/20/20 Spend/Save/Share |
| C2 | APR: credited + caretaker-confirms; nudge at ≥$1.00 accrued; manual "pay out now" bonus action |
| C3 | v1 UI: full caretaker sidebar with "coming soon" badges + one-line placeholders |
| C4 | Reconciliation: weekly nudge + manual override |
| C5 | Onboarding: 4-step wizard with Y-fork at step 4 (fresh deposit OR opening balances) |
| C5b | Subcategories visible in v1 UI; defaults seeded; spends categorized at log time |
| C6 | Funders: top-level sidebar item, dedicated screen, per-funder stats, picker in deposit flow |
| C7 | Sunday digest: ships in v1 as caretaker-printable artifact |
| C8 | Threat-model prep: audit cols + owner_pin_hash + COPPA trigger comment |

### Architecture (from Eng review + outside voice)
| # | Decision |
|---|---|
| E1 | Drop Drizzle. Use `@supabase/ssr` + `supabase-js` + generated types. Schema in SQL files; RLS works automatically |
| E2 | Deposit data model: parent + child transactions |
| E3 | Triggers handle INSERT + UPDATE + DELETE on `transaction` |
| E4 | Denormalize `caretaker_user_id` on every domain table; insert triggers auto-populate from parent piggybank |
| E5 | Onboarding step 1 atomicity via single Postgres RPC (`create_piggybank_with_defaults`) |
| E6 | Validation rules per `kind` enforced in both Zod and DB CHECK constraints |
| E7 | Rounding: Share gets remainder cents (pro-charity bias) |
| E8 | `integer` cents per-row; `bigint` on balance counters (overflow-safe for v2 analytics) |
| E9 | Error logging via Vercel + Supabase logs; no PII; Sentry deferred to v1.1 |
| E10 | Vitest for all server actions; skip Playwright in v1 |
| E11 | `/coming-soon/[feature]` parameterized route reading feature manifest |
| E12 | **Soft delete piggybank** (`deleted_at`) + 30-day purge cron; misclick-safe for beta |
| **OV1** | `transaction.parent_id` FK is `DEFERRABLE INITIALLY DEFERRED` + Vitest for non-obvious insertion order |
| **OV2** | Propagation trigger marked `SECURITY DEFINER` + `SET search_path = ''` + Vitest under real caretaker JWT |
| **OV3** | Void-transaction action ships in Phase 5 (writes offsetting `kind='adjustment'`); edit deferred to v1.1 |
| **OV4** | Subcategory archive rejected if `balance_cents != 0` with helpful error |
| **OV6** | Funder find-or-create via dedicated `find_or_create_funder(name, relationship)` SQL function with case-insensitive `lower(display_name)` partial unique index |
| **OV7** | Dashboard ships **named slot contract** in Phase 4 (`banner`, `cta-row`, `widgets`) so Phases 6/7/8 truly parallelize |
| **OV9** | Skip analytics tracking in v1; manual signal from co-devs; add Vercel Analytics events before public launch |
| **OV12** | Settings → "Export my data" (JSON) + surfaced on delete-confirm modal |

### Stack
| Layer | Choice | Notes |
|---|---|---|
| Hosting | Vercel (Hobby tier) | $0 |
| DB / Auth | Supabase (Free tier) | $0 |
| Framework | Next.js 14 App Router + Server Actions | |
| Language | TypeScript strict | |
| DB client | `@supabase/ssr` + `@supabase/supabase-js` | Schema in `supabase/migrations/*.sql`; types via `supabase gen types typescript --linked > src/lib/db/types.ts` |
| Aggregations | SQL views (`v_funder_stats`, `v_weekly_digest`) | |
| Styling | Tailwind extended with mockup tokens | |
| Components | shadcn/ui primitives + custom branded surfaces | |
| Validation | Zod (server action) + DB CHECK constraints | |
| Auth | Email + password via Supabase email (no confirmation in beta) | |
| Money | `integer` cents per-row; `bigint` on balance counters | `Number()` at JS boundary for bigint reads |
| Print | Native browser `@media print` | |
| Analytics | Deferred to public launch | Manual beta signal |
| Logging | Vercel function logs + Supabase database logs | No PII |
| Tests | Vitest | Playwright deferred to v1.1 |
| Email service | Deferred — Resend swap before public launch | |

## 3. v1 scope

### Ships
- 4-step onboarding wizard (kid profile → split → funders → starting state Y-fork)
- Caretaker dashboard with **named slots** (composable for v1.1 widgets)
- Bucket detail screens
- Activity log (filterable; parent-row collapse with expand-to-children)
- Funders screen (list, per-funder stats, add/edit/archive)
- Settings (distribution rule, kid profile, password change, **soft delete piggybank**, **export JSON**)
- Add Money flow (funder picker via `find_or_create_funder`, source, auto/manual distribution preview)
- Log Spend flow
- **Void Transaction action** (any txn row → void → writes offsetting adjustment)
- Weekly reconciliation nudge + manual override
- Sunday digest printable view
- Sidebar "coming soon" placeholders (single `/coming-soon/[feature]` route)

### Schema-ready, UI hidden in v1
- Owner UI — `kid_profile.owner_user_id`, `owner_pin_hash`, RLS hooks reserved
- APR — `subcategory.apr_bps`, `unsettled_interest_cents` exist
- Spend requests — `request` table exists
- Multi-funder auth — `funder.user_id` nullable
- Edit transaction — schema supports UPDATE; UI deferred to v1.1
- Subcategory transfer — defer until archive-with-balance demands it

### Out of scope (explicit deferrals)
- Owner UI (entire surface)
- Real banking rails (Stripe Issuing, real yield, real giving)
- Multi-child households
- Push notifications
- Receipt OCR / photo attachments
- Goal templates
- Monthly / annual statements
- Email notifications (digest print-only; reconciliation in-app banner)
- Drizzle ORM
- Playwright E2E
- Sentry / error monitoring
- **Hard delete piggybank** (soft delete only)
- **Edit transaction UI** (void-only in v1)
- Caretaker rounding-bias preference (Share fixed)
- `reconciliations` table (one adjustment txn per event)
- Analytics tracking (instrumented before public launch)

## 4. Sequencing principles

1. Schema first.
2. Auth before any UI work.
3. Read paths before write paths (dashboard skeleton with seed data, then mutations).
4. Money math gets Vitest from day 1.
5. Each phase ends in a demoable state.
6. **Dashboard ships with named slots in Phase 4** so Phases 6/7/8 can land independently without merge conflicts.

## 5. Phases

### Phase 0 — Teardown + tooling install
**Goal:** Clean slate, dev environment ready.

**Tasks:**
- Delete `src/` contents
- Delete `supabase/migrations/20240101000000_initial_schema.sql`
- `npm install` adds: `zod`, `@hookform/resolvers`, `react-hook-form`, `vitest`, `@vitest/ui`, `happy-dom`
- `npx shadcn-ui@latest init` with config matching mockup tokens
- `npx shadcn-ui@latest add button input label dialog combobox select dropdown-menu toast form tabs separator card badge`
- Extend `tailwind.config.ts` with brand tokens (rose, bucket colors, off-white, fonts)
- `src/app/globals.css`: font imports, CSS variables
- Skeleton: `src/lib/supabase/server.ts` + `client.ts`, `src/lib/utils.ts`, `src/lib/distribution.ts`, `vitest.config.ts`
- `package.json` scripts: `test`, `test:watch`, `db:types`

**Deliverable:** Empty app, all deps installed.
**Acceptance:** `npm run dev` boots; `npm run build` passes; `tsc --noEmit` passes; `npm test` runs.
**Effort:** ~2 hours.

---

### Phase 1 — Schema + migration + RLS + triggers
**Goal:** Target-state DB schema live in Supabase, queryable via Supabase client, with auto-maintained balances, JWT-aware RLS, soft-delete-safe queries.

**Tasks:**
- Write `supabase/migrations/<timestamp>_v1_initial.sql` with all tables:
  - `kid_profile` (audit cols, `owner_user_id`, `owner_pin_hash`, `owner_auth_mode`, COPPA trigger comment)
  - `piggybank` (`caretaker_user_id` FK, **`deleted_at timestamptz`**)
  - `distribution_rule` (defaults to 6000/2000/2000 bps)
  - `bucket` (3 per piggybank, kind ∈ spend/save/share, `balance_cents bigint`)
  - `subcategory` (`apr_bps`, `unsettled_interest_cents bigint`, `balance_cents bigint`, `archived_at`)
  - `funder` (audit cols, nullable `user_id` for v2)
  - `transaction` (`amount_cents integer`, `parent_id` self-FK **`DEFERRABLE INITIALLY DEFERRED`**, `kind` enum, denormalized `caretaker_user_id`)
  - `request` (schema-ready)
- **CHECK constraints:**
  - `transaction.parent_id IS NULL OR kind = 'deposit'`
  - Per-kind amount signs: `(kind='spend' AND amount_cents > 0) OR (kind IN ('deposit','interest') AND amount_cents > 0) OR (kind='opening_balance' AND amount_cents >= 0) OR (kind='adjustment')`
  - `distribution_rule.spend_bps + save_bps + share_bps = 10000`
- **Denormalize `caretaker_user_id`** on every domain table
- **Propagation trigger** marked `SECURITY DEFINER` + `SET search_path = ''` that copies `caretaker_user_id` from parent piggybank on insert
- **RLS policies** on every table: `caretaker_user_id = auth.uid()` (single-column index lookup); for `piggybank` the SELECT policy also enforces `deleted_at IS NULL` so soft-deleted rows are invisible to the app
- **Sub-table reads of soft-deleted parent:** RLS on sub-tables filters by `caretaker_user_id` only (caretaker still owns the data). Application-layer queries that return rows tied to a piggybank join `piggybank` and apply `deleted_at IS NULL` filter. Document the pattern in `src/lib/db/queries.ts` helpers.
- **Triggers** maintaining `bucket.balance_cents`, `subcategory.balance_cents`, `piggybank.total_balance_cents` on transaction INSERT/UPDATE/DELETE
  - Triggers operate only on rows with `bucket_id IS NOT NULL` (parent deposit rows aren't summed; children are)
- **Indexes:** `caretaker_user_id` on every table; `(piggybank_id, occurred_at DESC)` and `(funder_id, occurred_at DESC)` and `(bucket_id, occurred_at DESC)` on transaction
- **Partial unique index:** `CREATE UNIQUE INDEX funder_name_per_piggybank_uq ON funder (piggybank_id, lower(display_name)) WHERE archived_at IS NULL`
- **SQL views:** `v_funder_stats`, `v_weekly_digest` — cast aggregations to `bigint` to prevent overflow
- **Postgres RPCs:**
  - `create_piggybank_with_defaults(name, age, emoji, distribution_bps)` — atomic creation of kid_profile + piggybank + 3 buckets + default subs + distribution_rule + primary funder
  - `add_deposit(piggybank_id, amount, funder_name, source_type, note, distribution)` — atomic parent + 3 child inserts inside `BEGIN ... COMMIT`; uses `find_or_create_funder` internally
  - `find_or_create_funder(piggybank_id, display_name, relationship)` — SELECT existing (case-insensitive) → INSERT ON CONFLICT DO NOTHING → re-SELECT
  - `void_transaction(transaction_id, reason)` — writes offsetting adjustment txn; original row stays
  - `soft_delete_piggybank(piggybank_id)` — sets `deleted_at = now()`
- Apply via `supabase db push`
- `npm run db:types`
- `src/lib/db/seed.ts` — local-dev test caretaker + piggybank
- **Vitest tests:**
  - `balance-invariants.test.ts` — random sequence of INSERT/UPDATE/DELETE/VOID, assert `bucket.balance_cents = sum(child txns)`, no orphans
  - `rls.test.ts` — caretaker A's JWT cannot SELECT caretaker B's data; soft-deleted piggybank disappears from A's own queries
  - `cascade.test.ts` — soft-delete piggybank hides it; hard-delete (via purge cron) cascades all children
  - `fk-ordering.test.ts` — parent + children in non-obvious insertion order inside DEFERRABLE transaction succeeds
  - `trigger-security.test.ts` — under real caretaker JWT, transaction insert succeeds and `caretaker_user_id` populates
  - `funder-race.test.ts` — concurrent "grandma" / "Grandma" insertions produce one row (case-insensitive partial unique index works)

**Deliverable:** All schema live; RLS enforces caretaker isolation including soft-delete invisibility; balance triggers maintain invariants for all mutation kinds; all RPCs work atomically.
**Acceptance:** All 6 Vitest test files pass; manual smoke check that `create_piggybank_with_defaults` rolls back on any sub-insert failure.
**Effort:** ~2 days (revised up from 1.5 — additional triggers, RPCs, and tests).

---

### Phase 2 — Auth + protected routes + password reset
**Goal:** Caretaker can sign up, log in, log out, reset password.

**Tasks:**
- `/signup`, `/login`, `/forgot-password`, `/reset-password` pages
- `/auth/callback` route handler
- `src/middleware.ts`: protect app routes, redirect unauth → `/login`
- `/logout` server action
- Manual: disable email confirmation in Supabase dashboard
- Configure Supabase email templates (beta-appropriate copy)
- **Vitest:** signup/login validation
- **Manual:** end-to-end signup → login → logout → forgot → reset

**Deliverable:** Caretaker auth flows work.
**Acceptance:** All flows end-to-end; protected routes redirect; RLS confirmed cross-account.
**Effort:** ~1 day.

---

### Phase 3 — Onboarding wizard
**Goal:** First-time caretaker completes setup and lands a first deposit.

**Tasks:**
- `/onboarding` route, URL-driven steps
- **Step 1:** kid_profile (name + age + emoji) → calls `create_piggybank_with_defaults` RPC
- **Step 2:** default split edit (60/20/20 preselected, three inputs sum-validated to 10000 bps)
- **Step 3:** funders (primary added by RPC; add Grandma etc. inline; skip to continue)
- **Step 4 Y-fork:**
  - **Fresh:** first-deposit form (amount, funder picker, source, live auto-distribution preview). Calls `add_deposit` RPC.
  - **Migrating:** opening-balance form (3 per-bucket inputs). Writes 3 `kind='opening_balance'` transactions atomically.
- Confetti welcome → `/dashboard`
- Resumable: `/dashboard` server check redirects to `/onboarding?step=N` if incomplete
- **Vitest:**
  - `distribution.test.ts` — happy path + rounding edges + zero rejection + invariant `sum(buckets) === amount` + Share-gets-remainder verified
  - `onboarding-actions.test.ts` — RPC atomicity, unicode kid names handled, caretaker_user_id propagates

**Deliverable:** First-time caretaker lands on dashboard with non-zero state.
**Acceptance:** All 4 steps + back button + resumability; Vitest passes.
**Effort:** ~2-3 days.

---

### Phase 4 — Dashboard (with named slots) + Bucket detail + Activity + Coming-soon
**Goal:** Caretaker sees current state; dashboard is composable for later phases.

**Tasks:**
- App shell layout: sidebar (Dashboard, Buckets, Activity, Funders, Settings) + coming-soon badged items (APR, Statements, Auto-allocation)
- `/coming-soon/[feature]` reads `src/lib/coming-soon-manifest.ts`
- **Dashboard with named slot contract** (`src/components/dashboard/Dashboard.tsx`):
  - Slot: `banner` (Phase 7 reconciliation banner fills it)
  - Slot: `cta-row` (Phase 8 "Print weekly digest" button fills it; Phase 4 ships with "Add money" / "Log spend")
  - Slot: `widgets` (Phase 6 funders widget fills it; v1.1 APR/statements widgets)
  - Default content for each slot when unfilled
  - Pages compose: `<Dashboard banner={<ReconcileBanner />} ctaRow={<CtaRow />}>`
- `/dashboard` server component: total card, 3 bucket cards (sub count), recent activity (last 5, parent-collapse-with-expand)
- `/buckets/[kind]`: sub list, sub balances, sub manage (add/rename/**archive** — archive rejects if `balance_cents != 0` with helpful error)
- `/activity`: full transaction list, filter sidebar (bucket, sub, date range, source_type, funder), URL-encoded filters, paginated 50/page, parent rows collapse children, void action on row hover (calls into Phase 5 once shipped)
- Mobile responsive (sidebar → bottom nav per mockup)
- **Vitest:** subcategory archive rejection logic; activity filter combinations; parent/child grouping helper

**Deliverable:** Read-only screens render against real data; dashboard slot contract documented and tested.
**Acceptance:** Dashboard total = sum(buckets) = sum(transactions); archive rejects non-zero balance with correct message; slot fills render correctly in Storybook-style preview.
**Effort:** ~3-4 days.

---

### Phase 5 — Add Money + Log Spend + Void (write paths)
**Goal:** Caretaker records and corrects real money movement.

**Tasks:**
- `/add-money` modal: amount, funder picker (autocomplete from funders + "Add new" inline), source_type radio, auto/manual distribution toggle
- `/log-spend` modal: amount, bucket picker, sub picker, note, date
- **Void transaction action:** on any activity row → confirm modal ("Void this transaction? It will write a reversing adjustment.") → calls `void_transaction` RPC. Original row stays; voided rows render with strikethrough + adjustment line below
- Server actions: `addDeposit`, `logSpend`, `voidTransaction` (all Zod-validated, call respective RPCs)
- Spend RPC uses `SELECT ... FOR UPDATE` on the subcategory row
- **Vitest:**
  - Distribution integration paths
  - Spend rejection on sub-balance underflow
  - Distribution sum-validation rejection
  - 100-step random deposit/spend/void sequence leaves `bucket.balance_cents = sum(transactions)` invariant
  - Void writes correct offsetting adjustment
  - Funder find-or-create case-insensitive match returns existing
- **E2E candidate:** concurrent spend submissions don't oversubtract

**Deliverable:** Caretaker deposits, spends, and voids; balances consistent across all mutations.
**Acceptance:** All Vitest pass; activity log renders voids correctly; concurrent-spend test confirms serialization.
**Effort:** ~3 days (revised up to include void).

---

### Phase 6 — Funders screen *(parallel-safe after Phase 5; fills dashboard `widgets` slot)*
**Goal:** Caretaker manages funders and sees per-funder stats.

**Tasks:**
- `/funders`: list view sourced from `v_funder_stats`; sortable
- Add/edit/archive funder modal
- `/funders/[id]`: contribution history (parent rows only, no double-counting)
- Add Wire Add Money picker to live funders list (already integrated Phase 5)
- DB rule: cannot delete funder with linked txns; only archive
- **Optional:** funders widget for dashboard `widgets` slot (top 3 contributors this month) — ship if time
- **Vitest:** stats helper, archive vs delete distinction

**Deliverable:** Funders first-class surface.
**Acceptance:** Stats match SQL aggregations; archived funders hide from picker but persist in activity.
**Effort:** ~1-2 days.

---

### Phase 7 — Reconciliation nudge *(parallel-safe after Phase 5; fills dashboard `banner` slot)*
**Goal:** Caretaker reconciles weekly.

**Tasks:**
- `ReconcileBanner` component fills dashboard `banner` slot when `now - last_reconcile_at > 7 days`
- "Check the jar" flow: input actual jar total → compute diff → reason radio → writes `kind='adjustment'` with reason in note
- Manual "Adjust total" always available from Settings or activity log
- Activity log renders adjustment rows distinctly
- **Vitest:** adjustment writes correctly; trigger updates totals

**Deliverable:** Drift recoverable.
**Acceptance:** Banner appears appropriately; adjustment with reason works; Vitest passes.
**Effort:** ~1 day.

---

### Phase 8 — Sunday digest *(parallel-safe after Phase 5; fills dashboard `cta-row` slot)*
**Goal:** Caretaker generates a printable weekly summary.

**Tasks:**
- `/digest/[week]` route (ISO `YYYY-WW`, default current)
- One-page layout: kid header, total + weekly delta, top 3 spends, goal progress, friendly copy
- `@media print` CSS: hide sidebar, one letter page, colors render
- "Print this week's digest" button in dashboard `cta-row` slot → opens `/digest/<current>` new tab
- SSR for screenshot/share-as-image
- **Vitest:** week aggregation queries, top-spend helper, copy template renders

**Deliverable:** Printable digest.
**Acceptance:** Print preview correct; numbers match dashboard; copy is warm.
**Effort:** ~1-2 days.

---

### Phase 9 — Settings + export + final polish
**Goal:** Loose ends, ready for beta cohort.

**Tasks:**
- `/settings` page: kid profile edit, default distribution rule edit, password change form
- **"Export my data"** button → downloads `piggybank-export-{date}.json` (all transactions, funders, subs, buckets, distribution rule)
- **Soft delete piggybank** modal: typed-confirm + "Export your data first?" link to export. Calls `soft_delete_piggybank` RPC. Shows "Restorable for 30 days" copy.
- Empty states for every screen
- Error states: every server action wraps try/catch → `console.error(actionName, sanitizedError)` → toast user-friendly message. No PII in logs
- Mobile responsive QA
- Lighthouse dashboard ≥ 90 a11y, ≥ 80 perf
- `docs/beta-onboarding.md` — one-page guide for co-developers (signup URL, what to expect, how to file feedback, what "void" / "soft delete" / "reconcile" mean)
- `SETUP.md` updated for new schema/auth/local-dev flow

**Deliverable:** Production-ready beta build.
**Acceptance:** All write paths handle errors; 390px and 1280px render mockup-faithfully; Lighthouse a11y ≥ 90; export downloads valid JSON.
**Effort:** ~2 days (revised up to include export).

---

## 6. Total estimate

| Phase | Effort | Lane |
|---|---|---|
| 0. Teardown + tooling | ~2 hours | Sequential |
| 1. Schema + RLS + triggers + RPCs | ~2 days | Sequential |
| 2. Auth + password reset | ~1 day | Sequential |
| 3. Onboarding wizard | ~2-3 days | Sequential |
| 4. Dashboard (with slots) + Buckets + Activity + Coming-soon | ~3-4 days | Sequential |
| 5. Add Money + Log Spend + Void | ~3 days | Sequential (blocks 6/7/8) |
| 6. Funders | ~1-2 days | **Parallel A** |
| 7. Reconciliation | ~1 day | **Parallel B** |
| 8. Sunday digest | ~1-2 days | **Parallel C** |
| 9. Settings + export + polish | ~2 days | Sequential after 6/7/8 |
| **Total (sequential)** | **~16-19 working days** | |
| **Total (parallelized)** | **~13-15 working days** | |

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Distribution rounding leaks cents** | Floor-first-two, Share gets remainder (E7). Single source of truth: `computeDistribution(amount, rule)`. Vitest verifies invariant on 1000 random amounts |
| **Email rate limit during beta launch** (~4/hour shared Supabase SMTP) | Stagger beta invites; Resend integration ready as a public-launch swap |
| **shadcn vs mockup styling conflicts** | Use shadcn only for listed primitives; branded surfaces fully custom |
| **Onboarding abandonment** | URL-driven steps = resumable. Server check redirects to incomplete step |
| **Concurrent spend writes oversubtract** | `SELECT ... FOR UPDATE` inside spend RPC |
| **Triggers vs app logic for balances** | Triggers chosen for atomicity; clear naming + Vitest invariants on INSERT/UPDATE/DELETE/VOID |
| **Deposit parent-child schema corruption** | `add_deposit` RPC atomic; CHECK constraints; `DEFERRABLE INITIALLY DEFERRED` FK (OV1) lets non-obvious insertion orders succeed at commit. Vitest verifies no orphans |
| **RLS blocks propagation trigger** | Trigger marked `SECURITY DEFINER` + empty `search_path` (OV2). Vitest under real caretaker JWT confirms inserts succeed |
| **Denormalized `caretaker_user_id` drift** | Insert triggers auto-populate; app code never sets the column. Trigger is single source of truth |
| **RLS subquery scaling** | Single-column index lookup pattern (E4 denormalization); RLS constant-time regardless of caretaker scale |
| **Funder case-insensitive race** | Partial unique index `(piggybank_id, lower(display_name)) WHERE archived_at IS NULL` + `find_or_create_funder` RPC handles race (OV6) |
| **Phases 6/7/8 merge conflicts on dashboard** | Named slot contract shipped in Phase 4 (OV7) — each phase fills its own slot file |
| **Beta caretaker misclicks delete** | Soft delete + 30-day purge (E12 revised). Restorable via Supabase dashboard UPDATE |
| **Beta caretaker mis-logs a transaction** | Void action ships in Phase 5 (OV3). Writes offsetting adjustment, preserves audit |
| **Subcategory archive with money in it** | Reject with helpful error (OV4); v1.1 transfer support unlocks richer flow |
| **Aggregate overflow risk** | `bigint` on balance counters; SQL view SUMs cast to bigint (OV-E8 split) |
| **Activity log noise from parent + child rows** | UI groups by parent_id; children render only when expanded. Bucket filter queries children directly |

## 8. Worktree parallelization

**Sequential (blocking):** P0 → P1 → P2 → P3 → P4 → P5

**Parallel after Phase 5** (enabled by dashboard slot contract in P4):
- **Lane A:** P6 Funders (`src/app/funders/` + optional dashboard widgets slot)
- **Lane B:** P7 Reconciliation (`src/app/reconcile/` + dashboard banner slot)
- **Lane C:** P8 Sunday digest (`src/app/digest/` + dashboard cta-row slot)

Each lane edits its own files (route directory + own slot fill). Dashboard component itself is touched only in P4. Three worktrees recommended.

**Collect:** P9 polish runs after all three lanes merge.

## 9. Failure modes

| Codepath | Failure mode | Test | Error handling | User sees |
|---|---|---|---|---|
| `computeDistribution` | Rounding leaks cents | Vitest invariant | Deterministic | Never sees mismatched total |
| `add_deposit` RPC | FK ordering issue | Vitest fk-ordering | DEFERRABLE handles | n/a |
| `add_deposit` RPC | Funder find-or-create race | Vitest funder-race | Unique index handles | n/a (transparent) |
| `log_spend` | Concurrent oversubtract | Vitest E2E candidate | `SELECT ... FOR UPDATE` | Spend rejected with toast |
| `void_transaction` | Voiding an already-voided txn | Vitest | RPC checks idempotency | "Already voided" toast |
| `recordReconciliation` | Trigger updates wrong bucket | Vitest invariant | n/a | Invariant maintained |
| `archive_subcategory` | Archive with non-zero balance | Vitest | RPC rejects | Helpful error toast |
| Propagation trigger | RLS blocks caretaker JWT path | Vitest trigger-security | SECURITY DEFINER | n/a |
| Auth password reset | Token reuse after password change | Supabase handles | Built-in | "Invalid or expired link" |
| Soft delete piggybank | Soft-deleted rows leak into queries | Vitest rls + cascade | RLS policy + app-layer join filter | n/a (invisible) |
| Dashboard | RLS leak (caretaker B sees A) | Vitest rls | Postgres RLS | Never |
| Onboarding RPC | Partial state on failure | Vitest | Postgres transaction rolls back | Toast; retry clean |
| Activity filter | Empty result | Manual QA | n/a | Empty state with friendly copy |

**Critical gaps:** None. All money-touching codepaths planned with test coverage.

## 10. Handoff sequence

1. **This plan is the source of truth.** Implementer (human or AI) reads end-to-end before Phase 0.
2. **Lock Phase 1 schema** before any app code is written against it.
3. **Beta-of-one** after Phase 5 — minimum feature set for one real caretaker to test for a week.
4. **Full beta cohort** after Phase 9.
5. **Public launch checkpoint requires:**
   - Resend swap (email rate limit risk)
   - Supabase email confirmation re-enabled
   - COPPA review if owner UI roadmapped
   - Vercel Pro if bandwidth or commercial-use changes the calculus
   - Sentry integration if beta surfaced hard-to-diagnose errors
   - **Vercel Analytics events instrumented** (`onboarding_completed`, `deposit_logged`, `spend_logged`, `reconciliation_completed`) for real activation/retention measurement
   - **Soft-delete purge cron** activated (manual purge during beta is fine; cron before public)
