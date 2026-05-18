# CM Piggybank — v1 Implementation Plan

**Status:** Draft v2 · post `/plan-eng-review`
**Date:** May 2026
**Estimated duration:** ~14–19 working days (~3–4 weeks of focused build, ~3 weeks if Phases 6/7/8 parallelize)

## 1. Context

- **PRD:** `~/Downloads/PigybankPRD.md` (v0.1)
- **Target-state mockup:** `~/Downloads/piggybankmockuptargetstate.html`
- **Scope path:** Path A (Spreadsheet-killer, slim ship, target-state-ready schema)
- **Strategic constraint:** zero ongoing cost during beta
- **Current repo state:** v0 prototype (single-user flat schema) will be **fully discarded**; `.git` history preserved as documentation of the prototype phase
- **Code home:** GitHub `cma25025/cm-piggybank`, Vercel project `cm-piggybank` (id `prj_ivgoHOYF2cSqYazxECU7Th0SBvQ7`), Supabase project `supabase-fulvous-arrow` (ref `scuxpypcxwlyyfgovncf`) — all linked

This plan replaces the v0 codebase entirely. It is sequenced for **shortest-path-to-beta** — each phase produces something that can be demoed to beta caretakers, so the build can stop early if signal demands a pivot.

## 2. Locked decisions

### Product (from CEO review)
| # | Decision | Source |
|---|---|---|
| 1 | Default split: 60/20/20 Spend/Save/Share | CEO review §1 |
| 2 | APR: credited + caretaker-confirms; nudge at ≥$1.00 accrued; manual "pay out now" bonus action | CEO review §2 |
| 3 | v1 UI: full caretaker sidebar with "coming soon" badges + one-line placeholders | CEO review §3 |
| 4 | Reconciliation: weekly nudge + manual override | CEO review §4 |
| 5 | Onboarding: 4-step wizard with Y-fork at step 4 (fresh deposit OR opening balances) | CEO review §5 |
| 5b | Subcategories visible in v1 UI; defaults seeded; spends categorized at log time | CEO review §5b |
| 6 | Funders: top-level sidebar item, dedicated screen, per-funder stats, picker in deposit flow | CEO review §6 |
| 7 | Sunday digest: ships in v1 as caretaker-printable artifact | CEO review §7 |
| 8 | Threat-model prep: audit cols + owner_pin_hash + COPPA trigger comment | CEO review §8 |

### Architecture (from Eng review)
| # | Decision | Source |
|---|---|---|
| E1 | **Drop Drizzle.** Use `@supabase/ssr` + `supabase-js` + generated types. Schema in SQL files; RLS works automatically because the client carries the JWT | Eng review §1 |
| E2 | **Deposit data model: parent + child transactions.** Parent carries funder/source/note (`bucket_id=NULL`); children carry per-bucket assignment | Eng review §2 |
| E3 | **Triggers handle INSERT + UPDATE + DELETE** on `transaction` (not just INSERT) so corrections and reconciliations maintain invariants | Eng review §3 |
| E4 | **Denormalize `caretaker_user_id` on every domain table** from day 1 + insert triggers to auto-populate from parent piggybank. RLS becomes single-column index lookup | Eng review §4 |
| E5 | **Onboarding step 1 atomicity:** wrapped in a single Postgres RPC (`create_piggybank_with_defaults`) so the 11+ inserts are atomic | Eng review §5 |
| E6 | **Validation rules per `kind`** enforced in both Zod (server-action) and DB `CHECK` constraints | Eng review §6 |
| E7 | **Rounding: Share gets the remainder cents** (pro-charity bias, documented in distribution function) | Eng review §7 |
| E8 | **`integer` cents** (max $21M), not `bigint`. Saves JS BigInt conversion friction | Eng review §8 |
| E9 | **Error logging via Vercel function logs + Supabase logs.** No PII (kid names, amounts, emails) in logs. Sentry deferred to v1.1 | Eng review §9 |
| E10 | **Vitest for all server actions** (not just deposit math); skip Playwright in v1 | Eng review §10 |
| E11 | **`/coming-soon/[feature]`** as a single parameterized route reading a feature manifest | Eng review §11 |
| E12 | **Hard delete on piggybank** with explicit `ON DELETE CASCADE` chains | Eng review §12 |

### Stack
| Layer | Choice | Notes |
|---|---|---|
| Hosting | Vercel (Hobby tier) | $0 |
| DB / Auth | Supabase (Free tier) | $0 |
| Framework | Next.js 14 App Router + Server Actions | |
| Language | TypeScript strict | |
| DB client | `@supabase/ssr` + `@supabase/supabase-js` | Schema lives in `supabase/migrations/*.sql`; types via `supabase gen types typescript --linked > src/lib/db/types.ts` |
| Aggregations | SQL views (`v_funder_stats`, `v_weekly_digest`) | Queried via Supabase nested select |
| Styling | Tailwind CSS extended with mockup tokens | |
| Components | shadcn/ui primitives + custom branded surfaces | |
| Validation | Zod at server-action boundary + DB `CHECK` constraints | Defense in depth |
| Auth | Email + password via Supabase email (no confirmation in beta) | Disable confirmation in Supabase dashboard |
| Money | `integer` cents (max $21M) | All financial math has Vitest coverage |
| Print | Native browser `@media print` | |
| Analytics | Vercel Analytics (Hobby) | |
| Logging | Vercel function logs + Supabase database logs | No PII in logs |
| Tests | Vitest (unit + server-action coverage) | Playwright deferred to v1.1 |
| Email service | Deferred — Resend swap before public launch | |

## 3. v1 scope

### Ships
- 4-step onboarding wizard (kid profile → split → funders → starting state Y-fork)
- Caretaker dashboard (total card, 3 bucket cards with sub breakdown, recent activity, Sunday digest CTA)
- Bucket detail screens (sub list, manage subs)
- Activity log (filter by bucket, sub, date range, source, funder)
- Funders screen (list, per-funder stats, add/edit/archive)
- Settings (distribution rule edit, kid profile edit, password change, delete piggybank)
- Add Money flow (funder picker, source, auto/manual distribution preview)
- Log Spend flow (bucket → sub → note → date)
- Weekly reconciliation nudge + manual override
- Sunday digest printable view
- Sidebar "coming soon" placeholders for APR, Statements, Auto-allocation (single `/coming-soon/[feature]` route)

### Schema-ready, UI hidden in v1
- Owner UI (entire surface) — `kid_profile.owner_user_id`, `owner_pin_hash`, RLS hooks reserved
- APR mechanism — `subcategory.apr_bps`, `unsettled_interest_cents` exist
- Spend requests — `request` table exists, no submission flow
- Multi-funder auth — `funder.user_id` nullable

### Out of scope (explicit deferrals)
- Owner UI (entire surface)
- Real banking rails (Stripe Issuing, real yield, real giving)
- Multi-child households
- Push notifications
- Receipt OCR / photo attachments
- Goal templates
- Monthly / annual statements
- Email notifications (digest is print-only; reconciliation is in-app banner)
- **Drizzle ORM** (eng review §1)
- **Playwright E2E** (eng review §10; manual QA + Vitest in v1)
- **Sentry / error monitoring** (eng review §9; Vercel + Supabase logs only)
- **Soft delete / archival on piggybank** (eng review §12; hard delete only)
- **Caretaker rounding-bias preference** (eng review §7; Share fixed)
- **`reconciliations` table** (eng review; one adjustment txn per event in v1; full table v1.1)

## 4. Sequencing principles

1. **Schema first.** Phase 1 is the foundation; locking it early lets all subsequent phases use real types.
2. **Auth before any UI work.** No screen renders until there's a real user model.
3. **Read paths before write paths.** Dashboard skeleton with seeded data, then enable mutations against it.
4. **Money math gets Vitest from day 1.** Every distribution/balance/aggregation function is tested before its UI ships.
5. **Each phase ends in a demoable state.** A beta caretaker could in principle use the system after any completed phase.
6. **Phases 6/7/8 can parallelize after Phase 5** lands (see §10 worktree strategy).

## 5. Phases

### Phase 0 — Teardown + tooling install
**Goal:** Clean slate, dev environment ready.

**Tasks:**
- Delete `src/` contents
- Delete `supabase/migrations/20240101000000_initial_schema.sql`
- `npm install` adds: `zod`, `@hookform/resolvers`, `react-hook-form`, `vitest`, `@vitest/ui`, `happy-dom`
- `npx shadcn-ui@latest init` with config matching mockup tokens
- `npx shadcn-ui@latest add button input label dialog combobox select dropdown-menu toast form tabs separator card badge`
- Extend `tailwind.config.ts`: brand rose `#F4655E`, bucket colors, off-white bg `#FDF8F4`, line `#EBE4DC`, fonts (Fraunces, Outfit, DM Sans)
- `src/app/globals.css`: font imports, CSS variables matching mockup `:root`
- Create skeleton: `src/lib/supabase/server.ts` + `src/lib/supabase/client.ts` (Auth-aware), `src/lib/utils.ts` (cn helper from shadcn), `src/lib/distribution.ts` (rounding math), `vitest.config.ts`
- Add `package.json` scripts: `test`, `test:watch`, `db:types` (runs `supabase gen types typescript --linked > src/lib/db/types.ts`)
- Verify: `npm run dev` boots a placeholder `/` page; `npm test` runs (zero tests, passes)

**Deliverable:** Empty Next.js app with all dependencies installed and design tokens wired.
**Acceptance:** `npm run dev` starts, `npm run build` passes, `tsc --noEmit` passes, `npm test` runs.
**Effort:** ~2 hours.

---

### Phase 1 — Schema + migration + RLS + triggers
**Goal:** Target-state DB schema live in Supabase, queryable via Supabase client, with auto-maintained balances and JWT-aware RLS.

**Tasks:**
- Write `supabase/migrations/<timestamp>_v1_initial.sql` with all tables:
  - `kid_profile` (with `owner_user_id`, `owner_pin_hash`, `owner_auth_mode`, COPPA trigger comment)
  - `piggybank` (with `caretaker_user_id` FK)
  - `distribution_rule` (per piggybank, defaults to 6000/2000/2000 bps)
  - `bucket` (3 per piggybank, kind ∈ spend/save/share)
  - `subcategory` (with `apr_bps`, `unsettled_interest_cents`, `archived_at`)
  - `funder` (with nullable `user_id` for v2)
  - `transaction` (with `parent_id` self-FK, `kind` enum including all 6 values, `caretaker_user_id` denormalized)
  - `request` (schema-ready, no v1 UI)
- **CHECK constraints:**
  - `transaction.parent_id IS NULL OR kind = 'deposit'`
  - `transaction.kind = 'deposit' OR parent_id IS NULL` (only deposits have children)
  - Per-kind amount sign rules: `(kind='spend' AND amount > 0) OR (kind IN ('deposit','interest') AND amount > 0) OR (kind='opening_balance' AND amount >= 0) OR (kind='adjustment')`
  - `distribution_rule.spend_bps + save_bps + share_bps = 10000`
- **Denormalize `caretaker_user_id` on every domain table** + insert triggers to propagate from parent piggybank
- **RLS policies** on every table: `caretaker_user_id = auth.uid()` (single-column index lookup)
- **Triggers** maintaining `bucket.balance_cents`, `subcategory.balance_cents`, `piggybank.total_balance_cents` on transaction INSERT, UPDATE, AND DELETE
  - Important: triggers operate only on rows with `bucket_id IS NOT NULL` (parent deposit rows are not summed; children are)
- **Indexes:** `caretaker_user_id` on every table, `(piggybank_id, occurred_at DESC)` on transaction, `(funder_id, occurred_at DESC)` on transaction, `(bucket_id, occurred_at DESC)` on transaction
- **SQL views:** `v_funder_stats` (total contributed, last contribution, # deposits per funder), `v_weekly_digest` (per-week aggregations)
- **Postgres RPC:** `create_piggybank_with_defaults(name, age, emoji, distribution_bps)` — atomic creation of kid_profile + piggybank + 3 buckets + default subs + distribution_rule + primary funder
- Apply via `supabase db push`
- `npm run db:types` → regenerate types
- Write `src/lib/db/seed.ts` — creates one test caretaker + piggybank for local dev
- **Vitest tests:**
  - `src/lib/db/__tests__/balance-invariants.test.ts` — for a random transaction sequence, assert `bucket.balance_cents = sum(child transactions where bucket_id = X)`
  - `src/lib/db/__tests__/rls.test.ts` — caretaker A's session cannot SELECT caretaker B's data via Supabase client
  - `src/lib/db/__tests__/cascade.test.ts` — deleting piggybank cascades to all children correctly

**Deliverable:** All schema live in Supabase; RLS enforces caretaker isolation; balance triggers maintain invariants for all mutation kinds.
**Acceptance:**
- All tables exist with constraints
- RLS test passes
- Trigger test: insert/update/delete of child transaction correctly maintains bucket + piggybank totals
- Vitest balance-invariants test passes for 100 random sequences including corrections
- RPC creates all 11+ rows atomically (failure → no partial state)
**Effort:** ~1.5 days (revised up from 1 day given trigger scope).

---

### Phase 2 — Auth + protected routes + password reset
**Goal:** Caretaker can sign up, log in, log out, reset password.

**Tasks:**
- `/signup` page (email + password + confirm-password)
- `/login` page (email + password)
- `/forgot-password` page → Supabase reset email
- `/reset-password` page (consumes reset link, sets new password)
- `/auth/callback` route handler
- `src/middleware.ts`: protect all app routes, redirect unauth to `/login`
- `/logout` server action
- Manual: disable email confirmation in Supabase dashboard (Auth → Email Confirmations off) — document in `SETUP.md`
- Configure Supabase email templates (password reset wording, beta-appropriate)
- **Vitest:** signup/login server action validation (Zod rejection of bad inputs)
- **Manual test:** signup → log in → log out → forgot → reset → log in with new password

**Deliverable:** New caretaker can sign up and recover a forgotten password.
**Acceptance:** All flows work end-to-end; protected route redirects unauth → `/login`; RLS confirmed via cross-account API test.
**Effort:** ~1 day.

---

### Phase 3 — Onboarding wizard
**Goal:** First-time caretaker completes setup and lands a first deposit (fresh or opening balances).

**Tasks:**
- `/onboarding` route — URL-driven steps (`?step=1..4`)
- **Step 1:** kid_profile (name, age, emoji picker) → calls `create_piggybank_with_defaults` RPC (atomic creation per E5)
- **Step 2:** default split edit (60/20/20 preselected, three inputs sum-validated to 10000 bps)
- **Step 3:** funders (current user pre-added as primary; add Grandma etc. inline; skip to continue)
- **Step 4 — Y-fork:**
  - **Fresh:** first-deposit form (amount, funder, source, live auto-distribution preview using `computeDistribution`). Submits as 1 parent + 3 child transactions
  - **Migrating:** opening-balance form (3 per-bucket inputs). Writes 3 `kind='opening_balance'` transactions, one per bucket
- Confetti welcome → redirect to `/dashboard`
- Resumable: server-side check on `/dashboard` redirects to `/onboarding?step=N` if incomplete
- **Vitest:**
  - `src/lib/distribution.test.ts` — happy path, rounding edge cases ($33.33, $0.01, $1, $1000), zero rejection, invariant `sum(buckets) === amount`, Share-gets-remainder verified
  - `src/app/onboarding/actions.test.ts` — RPC atomicity, kid name with emoji/unicode handled, caretaker_user_id propagates to all rows

**Deliverable:** First-time caretaker completes wizard and lands on dashboard with non-zero piggybank state.
**Acceptance:** All 4 steps + back button + resumability work; fresh path distributes correctly; migrating path writes 3 opening balances; Vitest distribution tests pass.
**Effort:** ~2-3 days.

---

### Phase 4 — Dashboard + Bucket detail + Activity + Coming-soon (read paths)
**Goal:** Caretaker sees current state.

**Tasks:**
- App shell layout: sidebar (Dashboard, Buckets, Activity, Funders, Settings) + "coming soon" badged items (APR, Statements, Auto-allocation) → all point to `/coming-soon/[feature]`
- `/coming-soon/[feature]` route reads a feature manifest (`src/lib/coming-soon-manifest.ts`): each feature has display name, one-line description, target version
- `/dashboard`: total card (gradient, brand rose), 3 bucket cards (with sub count), Sunday digest CTA, recent activity (last 5 transactions, parent-row collapse with expand-to-children)
- `/buckets/[kind]`: bucket detail with sub list, individual sub balances, bucket-level activity, "Add subcategory" / rename / archive actions
- `/activity`: full transaction list with filter sidebar (bucket, sub, date range, source_type, funder), URL-encoded filters, paginated 50/page, parent rows collapse children by default
- Mobile responsive: sidebar collapses to bottom nav per mockup; cards stack
- **Vitest:** subcategory archive logic; activity filter combinations; parent/child grouping helper

**Deliverable:** All read-only screens render against real data, mockup-matched.
**Acceptance:** Dashboard total matches sum of bucket balances; filter combinations work and are URL-shareable; archived sub hides from add-spend picker but shows in historical activity; coming-soon manifest renders all 3 placeholders.
**Effort:** ~3-4 days.

---

### Phase 5 — Add Money + Log Spend (write paths)
**Goal:** Caretaker records real money movement.

**Tasks:**
- `/add-money` modal (Dialog): amount, funder picker (autocomplete from funders + "Add new" inline), source_type radio, auto/manual distribution toggle (manual exposes 3 per-bucket inputs that sum-validate to amount)
- `/log-spend` modal: amount, bucket picker, sub picker, note, date (defaults today)
- Server actions: `addDeposit`, `logSpend` — Zod validated, write transactions, revalidate `/dashboard` and `/activity`
- **Deposit write:** parent + 3 children in a single Postgres transaction (`supabase.rpc('add_deposit', {...})` for atomicity)
- **Spend write:** `SELECT ... FOR UPDATE` on the subcategory row to prevent concurrent oversubtract
- Funder find-or-create logic inside the deposit RPC
- **Vitest coverage:**
  - Distribution math for all auto/manual paths (Phase 3 covered the function; Phase 5 covers the integration)
  - Rejection of spend that drives sub-balance negative
  - Rejection of distribution that doesn't sum to deposit amount
  - 100-step random deposit/spend sequence leaves `bucket.balance_cents = sum(transactions)` invariant
  - Funder find-or-create returns existing funder for case-insensitive match
- **E2E candidate:** concurrent spend submissions don't oversubtract (test via two simultaneous server-action calls)

**Deliverable:** Caretaker deposits and spends; all balances stay consistent.
**Acceptance:** All Vitest pass including 100-sequence invariant; activity log shows new entries with funder/source/note; concurrent-spend test confirms FOR UPDATE serializes correctly.
**Effort:** ~2-3 days.

---

### Phase 6 — Funders screen *(parallel-safe after Phase 5)*
**Goal:** Caretaker manages funders and sees per-funder stats.

**Tasks:**
- `/funders`: list view (avatar, name, relationship, total contributed, last contribution, # deposits) — sortable, sourced from `v_funder_stats` view
- Add/edit/archive funder modal
- `/funders/[id]`: per-funder contribution history (filtered activity log; uses parent rows only to avoid double-counting)
- Wire Add Money picker to live funders list (Phase 5 already integrates; this phase ensures stats screen)
- DB-layer rule: cannot delete funder with linked transactions (CHECK or app-layer); only archive
- **Vitest:** stats helper, archive vs delete distinction

**Deliverable:** Funders is a first-class surface.
**Acceptance:** Stats match SQL aggregations exactly; archived funders hide from picker but persist in activity; cannot delete with linked txns.
**Effort:** ~1-2 days.

---

### Phase 7 — Reconciliation nudge *(parallel-safe after Phase 5)*
**Goal:** Caretaker reconciles digital vs physical weekly.

**Tasks:**
- Dashboard banner when `now - last_reconcile_at > 7 days` (last_reconcile_at = max(occurred_at) where `kind='adjustment'`; fallback piggybank.created_at)
- "Check the jar" flow: input actual jar total → compute diff → reason radio (forgot to log treats / found cash / unknown) → writes `kind='adjustment'` transaction with reason in note
- Manual "Adjust total" always available from Settings or activity log header
- Activity log renders adjustment rows distinctly ("Jar check: +$2.00 — Found extra cash")
- **Vitest:** adjustment writes correctly; trigger updates piggybank.total_balance_cents

**Deliverable:** Drift recoverable; weekly ritual exists.
**Acceptance:** Banner appears appropriately; adjustment with reason works; Vitest passes.
**Effort:** ~1 day.

---

### Phase 8 — Sunday digest (printable) *(parallel-safe after Phase 5)*
**Goal:** Caretaker generates a printable kid-friendly weekly summary.

**Tasks:**
- `/digest/[week]` route (week format: ISO `YYYY-WW`, default current)
- One-page layout: kid name + emoji header, total + weekly delta, top 3 spend items with notes, goal progress bars, friendly copy ("Maya saved $4 toward Lego Friends!")
- `@media print` CSS: hide sidebar, fit on one letter page, ensure colors render
- "Print this week's digest" button on dashboard → opens `/digest/<current-iso-week>` in new tab
- SSR for screenshot/share-as-image
- **Vitest:** week-aggregation queries, top-spend-this-week helper, copy template renders

**Deliverable:** Caretaker prints/screenshots a digest and hands it to the kid.
**Acceptance:** Print preview renders correctly (no sidebar, single page); numbers match dashboard; copy is warm.
**Effort:** ~1-2 days.

---

### Phase 9 — Settings + final polish
**Goal:** Loose ends, ready for beta cohort.

**Tasks:**
- `/settings` page: kid profile edit (name, age, emoji), default distribution rule edit, password change form, delete piggybank (typed-confirm modal with explicit `ON DELETE CASCADE` warning copy)
- Empty states for every screen
- Error states: every server action wraps in try/catch → `console.error(actionName, sanitizedError)` → toast user-friendly message. No PII in logs
- Mobile responsive QA across all screens
- Performance: Lighthouse on dashboard ≥ 90 accessibility, ≥ 80 performance
- `docs/beta-onboarding.md` — one-page guide for co-developers
- `SETUP.md` updated for the new schema/auth/local-dev flow

**Deliverable:** Production-ready beta build.
**Acceptance:** All write paths handle errors with user-visible toast; 390px and 1280px render mockup-faithfully; Lighthouse a11y ≥ 90.
**Effort:** ~1-2 days.

---

## 6. Total estimate

| Phase | Effort | Lane |
|---|---|---|
| 0. Teardown + tooling | ~2 hours | Sequential |
| 1. Schema + RLS + triggers | ~1.5 days | Sequential |
| 2. Auth + password reset | ~1 day | Sequential |
| 3. Onboarding wizard | ~2-3 days | Sequential |
| 4. Read paths + coming-soon | ~3-4 days | Sequential |
| 5. Write paths | ~2-3 days | Sequential (blocks 6/7/8) |
| 6. Funders | ~1-2 days | **Parallel A** |
| 7. Reconciliation | ~1 day | **Parallel B** |
| 8. Sunday digest | ~1-2 days | **Parallel C** |
| 9. Settings + polish | ~1-2 days | Sequential after 6/7/8 |
| **Total (sequential)** | **~14-19 working days** | |
| **Total (with parallelization)** | **~11-15 working days** | Lane A/B/C max-of merges |

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Distribution rounding leaks cents** | Floor-first-two strategy, Share gets remainder (E7). `computeDistribution(amount, rule)` is the only place that does the math; Vitest verifies sum invariant on 1000 random amounts × random rules |
| **Email rate limit during beta launch** (~4/hour shared Supabase SMTP) | Stagger beta invites across days. Resend integration ready as a Phase 9.5 swap before public launch |
| **shadcn vs mockup styling conflicts** | Use shadcn only for the listed primitives (Dialog, Combobox, Select, etc.). All branded surfaces (cards, dashboard, total card, bucket tiles) are custom — don't theme shadcn's Card primitive into a bucket tile |
| **Onboarding wizard abandonment between steps** | URL-driven steps means resumable. Server-side check on `/dashboard` redirects to `/onboarding?step=N` if incomplete |
| **Concurrent spend writes oversubtract from a sub** | Server action wraps the spend write in a Postgres transaction with `SELECT ... FOR UPDATE` on the subcategory row |
| **Triggers vs application logic for balance maintenance** | Triggers chosen for atomicity. Mitigation: clear naming (`maintain_balances_on_transaction_*`), schema comment, Vitest invariant tests on INSERT/UPDATE/DELETE paths |
| **Deposit parent-child schema corruption** (a parent row exists without its children, or vice versa) | All deposit writes go through `add_deposit` RPC which creates parent + children atomically. Direct SQL inserts are guarded by `CHECK (parent_id IS NULL OR kind = 'deposit')`. Children require non-null bucket_id; parents require null. Vitest verifies no orphans after 100 random sequences |
| **Denormalized `caretaker_user_id` drift** (sub-table row has wrong caretaker_user_id) | Insert triggers auto-populate from parent piggybank — caretaker_user_id is never set by app code. Trigger is the single source of truth |
| **RLS subquery scaling** | Single-column index lookup pattern (E4 denormalization) — RLS performance is constant regardless of piggybank count per caretaker |
| **Activity log noise from parent + child rows** | UI groups by parent_id; children render only when parent expanded. Filtering by bucket queries children directly (`WHERE bucket_id = X`) bypassing parent collapse |

## 8. Worktree parallelization (from Eng review)

**Sequential lanes (blocking):** Phase 0 → 1 → 2 → 3 → 4 → 5. Each touches shared schema, auth, or layout that the next depends on.

**Parallel lanes after Phase 5:**
- **Lane A:** Phase 6 (Funders) — touches `src/app/funders/`
- **Lane B:** Phase 7 (Reconciliation) — touches `src/app/reconcile/` + `src/components/dashboard/banner.tsx`
- **Lane C:** Phase 8 (Sunday digest) — touches `src/app/digest/`

Disjoint route directories; no shared state mutations beyond reading from already-shipped schema. Three worktrees recommended.

**Collect:** Phase 9 polish runs after all three lanes merge.

## 9. Failure modes

Every new codepath should have at least one test covering its primary failure mode:

| Codepath | Failure mode | Test? | Error handling | User sees? |
|---|---|---|---|---|
| `computeDistribution` | Rounding leaks cents | ✅ Vitest | n/a (deterministic) | Invariant: caretaker never sees mismatched total |
| `addDeposit` RPC | Funder find-or-create race | ✅ Vitest | Postgres unique index handles | n/a (transparent) |
| `logSpend` server action | Concurrent oversubtract | ✅ Vitest E2E candidate | `SELECT ... FOR UPDATE` | Spend rejected with toast |
| `recordReconciliation` | Trigger updates wrong bucket | ✅ Vitest invariant | n/a | Invariant maintained |
| Auth password reset | Token reuse after password change | ❌ (Supabase handles) | Supabase invalidates | "Invalid or expired link" |
| Activity log filter | Empty result | ⚠️ Manual QA | n/a | Empty state with friendly copy |
| Dashboard | RLS leak (caretaker B sees A's data) | ✅ Vitest RLS test | Postgres RLS enforces | n/a (never happens) |
| Onboarding RPC | Partial state after failure | ✅ Vitest | Postgres transaction rolls back | User sees error toast; retries cleanly |

**Critical gaps flagged:** None. All money-touching codepaths have planned test coverage.

## 10. Handoff sequence

1. **This plan is the source of truth.** Begin Phase 0 only after the plan is read end-to-end by the implementer (human or AI).
2. **Lock Phase 1 schema** before any application code is written against it — schema review is the cheapest moment to catch model errors.
3. **Beta-of-one** after Phase 5 (Add Money + Log Spend) — minimum feature set for one real caretaker to test for a week.
4. **Full beta cohort** after Phase 9.
5. **Public launch checkpoint requires:**
   - Resend swap (Risk: email rate limit)
   - Email confirmation re-enabled in Supabase
   - COPPA review if owner UI is roadmapped
   - Vercel Pro if bandwidth or commercial use changes the calculus
   - Sentry integration if beta surfaced hard-to-diagnose errors
