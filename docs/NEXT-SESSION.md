# Next Session — Handoff for the Next Claude Code

**Last updated:** 2026-05-22 — 🎉 **v1 COMPLETE** (Phases 0–9 shipped) + live-DB integration test harness
**Current state:** All 9 phases of v1 plan live on production Vercel. 9 Supabase migrations applied. 62 unit tests passing + 8 integration tests ready (skip until `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`). Post-v1 roadmap in `docs/DISCOVERY-ROADMAP.md` — recommended next is **posture B (Wait-a-Week + digest prompts)** from that doc.

## TL;DR (updated)

Caretaker can sign up → onboard → manage three buckets and subs → add money / log spends / void → reconcile weekly → print Sunday digest → edit settings → export JSON → soft-delete. The whole product loop works end-to-end.

What's NOT in v1 (deferred to v1.1+, see DISCOVERY-ROADMAP.md):
- Wait-a-Week list for big purchases
- Caretaker charity match on Give withdrawals
- Quarterly Give ceremony
- Owner UI (kid-facing)
- Real banking rails (Stripe Issuing)
- Multi-child households
- Multi-funder authentication

---

## TL;DR

A working v1 beta of CM Piggybank is on `main`. ~6,500 lines TS/TSX, 19 routes, 4 migrations. A caretaker can sign up → walk through 4-step onboarding → use the dashboard → add money / log spends / void mistakes. Three sidebar items are placeholder pages (`/funders`, real `/settings`, three `/coming-soon/*`) — those are Phases 6–9. Live-DB integration tests are still missing.

---

## Where things stand right now

| Layer | State |
|---|---|
| **GitHub** | `cma25025/cm-piggybank` main, 30+ commits ahead of original v0; latest `b90c000` |
| **Vercel** | Auto-deploys on push; project `cm-piggybank` (`prj_ivgoHOYF2cSqYazxECU7Th0SBvQ7`) |
| **Supabase** | Project `supabase-fulvous-arrow` (ref `scuxpypcxwlyyfgovncf`), 9 migrations applied |
| **Local dev** | `npm run dev` boots; `npm test` passes (62/62 unit); `npm run test:integration` ready (8 cases, skip without service-role key) |
| **CLI auth** | Supabase CLI logged in via PAT (rotate the one in transcript before public release) |

Recent commits (latest 10):
```
b90c000  Phase 9: Settings + JSON export + soft-delete UI — v1 COMPLETE
9cdee22  Phase 8: Sunday digest (Sun-Sat week, print-ready, dashboard CTA)
717fea0  Live-DB integration test harness — 4 test files, 8 cases
d2b2b9d  Update NEXT-SESSION.md with salvage state
9316fa5  Salvage 3/3: Spend UX revamp — bucket-first log-spend, optional sub
801e618  Salvage 2/3: schema bug fixes + dialog effect deps + zero-diff render
f22211c  Salvage 1/3: cherry-pick pure helpers + 49 vitest cases
5701a1c  Branch comparison doc — divergent claude/ branch analysis
7d814b0  Update NEXT-SESSION.md next-session recommendations
26f55e6  Phase 6 + 7 audit fixes + NEXT-SESSION update
```

---

## Smoke test — links + steps

**Local:**
```
npm run dev
# → http://localhost:3000          (landing → CTA → /signup)
# → http://localhost:3000/signup   (create test account)
# → http://localhost:3000/dashboard
```

**Production:** check the Vercel dashboard for the active prod URL (likely `https://cm-piggybank.vercel.app` or a preview alias). GitHub Deployments tab shows the latest production deploy hash; it should match `b90c000`.

**Manual Supabase steps that MUST be done first** (otherwise signup silently fails to log you in):

1. Supabase Dashboard → **Authentication → Sign In / Up → Disable "Confirm email"**
2. Supabase Dashboard → **Authentication → URL Configuration:**
   - Add `http://localhost:3000/auth/callback` to Redirect URLs (local)
   - Add `https://cm-piggybank.vercel.app/auth/callback` (production)

**Happy-path smoke** (~5 min):
1. `/` → "Create an account" → `/signup` with new email + password
2. → auto-redirect to `/onboarding/step-1` (kid name + age + emoji)
3. → step-2 (split editor, defaults to 60/20/20)
4. → step-3 (funders; primary funder already created)
5. → step-4 → "Starting fresh" tab → enter $50 from "You" → see live preview → submit
6. → land on `/dashboard` with total card + 3 bucket cards + recent activity
7. → click "− Log spend" → pick a Spend subcategory → enter $5 → submit
8. → `/activity` → click "Void" on the spend → confirm → row goes strikethrough

**Error-path smoke:**
- Try to log spend > sub balance → friendly error toast
- Try to archive a sub with non-zero balance → "Spend it down before archiving"
- Re-void a voided transaction → "Already voided"
- Try to access `/dashboard` without signing in → bounce to `/login?next=/dashboard`
- Sign in → bounced from `/login` and `/signup` to `/dashboard`

---

## How to prompt the next Claude Code session

Paste this into a new session:

> Read `docs/NEXT-SESSION.md` first, then `docs/polish-todo.md` (especially the latest Phase section), then `docs/PHASE-6-9-SPEC.md` if it exists. We're mid-build on CM Piggybank v1 — a custodial ledger for kids' piggy banks. Phases 0-5 are shipped; you're picking up from there.
>
> Conventions to preserve:
> - User CLAUDE.md says "no framework performance" — skip the gstack ceremony, surface findings as decisions, not sections
> - Audit-subagent pattern: after each phase commits, dispatch a `general-purpose` subagent in background to audit against the plan, append findings to `docs/polish-todo.md`
> - React 18 → use `useFormState` from `react-dom` (NOT `useActionState` from React 19)
> - Money: `integer` cents per-row, `bigint` on balance counters; format via `formatCents()` from `@/lib/utils`
> - Money math: `computeDistribution()` in `src/lib/distribution.ts` is the only place; Share gets remainder cents (pro-charity, documented)
> - Schema source of truth is SQL files in `supabase/migrations/`; regen types via `npm run db:types`
> - Server actions use Supabase Auth-aware client from `@/lib/supabase/server`; Drizzle is NOT used and was rejected in eng review
> - Every domain table carries `caretaker_user_id`; auto-propagated by `_a_propagate_caretaker_user_id` trigger (SECURITY DEFINER)
> - All write actions wrap try/catch → `console.error(actionName, ...)` (no PII) → toast user-friendly message
>
> Tell me what you read and what you're going to work on first.

---

## v1 work left

| Phase | Status | Notes |
|---|---|---|
| 0. Teardown | ✅ done | |
| 1. Schema + RLS + triggers + RPCs | ✅ done | + 1.5 audit fixes |
| 2. Auth + password reset | ✅ done | + 2.5 audit fixes + dev-mode error verbosity |
| 3. Onboarding wizard | ✅ done | |
| 4. Dashboard + Buckets + Activity + Coming-soon | ✅ done | + 4.5 audit fixes |
| 5. Add Money + Log Spend + Void | ✅ done | + 5.6 hotfix (RPC, useEffect, timezone, void lineage) |
| 6. Funders screen | ✅ done | + audit fixes (RPC trim, 30-day window, a11y) |
| 7. Reconciliation nudge | ✅ done | + audit fix (Spend bucket throw) |
| 8. Sunday digest | ⏳ **next** | uses `Dashboard.ctaRow` slot, spec in PHASE-6-9-SPEC.md |
| 9. Settings + JSON export + soft-delete UI | ⏳ next | |

**Also shipped this session:**
- Bucket color swap: Spend = green, Save = blue (unchanged), Share = red
- `scripts/reset-password.mjs` admin tool (called once for first beta caretaker)
- Dev-mode auth error verbosity (`NODE_ENV=development` shows raw Supabase errors)
- Landing page (/) rewrite — no longer the misleading "Phase 0 scaffold"

**Shipped 2026-05-22 (divergent-branch salvage):**
- **49 Vitest cases passing** (was 15) — closes the carry-forward Vitest P0
- `src/lib/activity/emoji.ts`, `src/lib/funders/aggregate.ts`, `src/lib/reconcile/staleness.ts` — pure helpers extracted with tests
- `v_funder_stats` view now filters voided deposits (was inflating funder totals)
- `find_or_create_funder` backfills relationship on existing-funder re-add
- `escapeLike()` helper for safe ILIKE patterns ("100% Grandma" no longer false-positives)
- Dialog `useEffect` deps fixed across 4 sites (second consecutive submit now closes dialog)
- Zero-diff $0.00 rendering — drops sign + uses muted text instead of "− $0.00"
- **Spend UX revamp:** bucket-first log-spend tiles, optional sub ("No goal — just the category"), gates on bucket.balance (not sub). PRD §5.3 "sub-amounts tally to bucket total" intentionally loosened — see commit `9316fa5` body

Detailed specs are in **`docs/PHASE-6-9-SPEC.md`** — concrete file lists, schema queries, dashboard slot integration, acceptance criteria, footguns. Read it before starting Phase 6.

**Spec highlights to know about going in:**
- **Phase 6** stat queries must filter `parent_id IS NULL AND kind='deposit'` to avoid triple-counting children. `FunderWidget` returns `null` when empty so the dashboard slot collapses.
- **Phase 7** requires a CHECK constraint relaxation migration on `transaction.amount_sign_rules` to allow zero-diff reconciliations (jar matched the app).
- **Phase 8** Sunday digest bypasses `v_weekly_digest` because Postgres `date_trunc('week', ...)` is Mon-Sun but the product framing is Sun-Sat. Custom JS week bounds + optional `?tz=` for caretaker timezone.
- **Phase 9** bundles all carried-forward polish-todo fixes into one safety migration (unique on `kid_profile`, etc) — pre-flight checks documented in the spec to avoid migration failure on existing beta data.

---

## Polish-todo highest-priority items (full file: `docs/polish-todo.md`)

**Must-fix before public launch (not blocking beta):**
- Live-DB integration tests (RLS, cascade, FK ordering, trigger security, funder race) — plan called for them, never built. Need test caretaker harness or `supabase start` local stack.
- Activity filters: only bucket filter implemented; plan called for sub, date range, source_type, funder filters.
- No tests for Phase 2 / 3 / 4 / 5 server actions — only `distribution.test.ts` passing.
- Rotate the Supabase PAT that was pasted in transcript.
- Add Vercel Analytics events for activation tracking before public launch (`onboarding_completed`, `deposit_logged`, `spend_logged`, `reconciliation_completed`).

**UX papercuts before broader beta:**
- Hardcoded emoji selects (Phase 3 onboarding step-1, Phase 4 sub-add) — 8 / 12 options.
- Subcategory rename not implemented (only add + archive).
- ✅ ~~Voided-parent-deposit's adjustment rows render as orphan rows in `/activity`~~ — FIXED in Phase 5.6 via `reversed_transaction_id` column + activity filter.

**Architectural:**
- `getDashboardData()` makes 4 round-trips per dashboard render; `AppShell` re-fetches piggybank on every nav. `React.cache()` would dedupe.
- "You" hardcoded as primary funder in `create_piggybank_with_defaults` RPC — not localizable.

---

## File / convention reference

| Topic | Where |
|---|---|
| Plan | `docs/v1-implementation-plan.md` (v3, post-eng-review + outside-voice) |
| Polish-todo | `docs/polish-todo.md` (audit findings per phase) |
| Next-phase specs | `docs/PHASE-6-9-SPEC.md` (generating in background) |
| PRD source of truth | `~/Downloads/PigybankPRD.md` |
| Mockup | `~/Downloads/piggybankmockuptargetstate.html` (tokens line up with `tailwind.config.ts`) |
| Schema | `supabase/migrations/*.sql` (SQL is source; `npm run db:types` regenerates) |
| Money math | `src/lib/distribution.ts` (+ `.test.ts`) |
| Auth helpers | `src/lib/auth/{schemas,get-user}.ts` |
| Supabase clients | `src/lib/supabase/{server,client}.ts` |
| Dashboard slots | `src/components/dashboard/dashboard.tsx` (banner / ctaRow / widgets) |
| Sidebar nav | `src/components/layout/sidebar.tsx` + `mobile-nav.tsx` |
| Coming-soon manifest | `src/lib/coming-soon-manifest.ts` |
| Stack docs | `SETUP.md` |

---

## Decisions already locked (don't re-litigate)

From CEO review (`docs/v1-implementation-plan.md` §2):
- Default split 60/20/20 Spend/Save/Share
- Subcategories visible in v1 UI
- Sidebar shows "coming soon" badges for unbuilt items
- Sunday digest ships as a caretaker-printable artifact
- APR uses caretaker-confirms settlement at ≥$1 threshold

From Eng review:
- Drop Drizzle; use `@supabase/ssr` + generated types only
- Parent + child transaction model for deposits
- Denormalize `caretaker_user_id` on every domain table (RLS perf)
- DEFERRABLE FK on `transaction.parent_id`
- `SECURITY DEFINER` + empty `search_path` on propagation trigger
- Soft delete piggybank (not hard delete) with 30-day purge
- Share gets the remainder cents (pro-charity bias)
- `integer` cents per-row, `bigint` on balance counters
- Vitest only; Playwright deferred to v1.1
- Vercel + Supabase logs for errors; Sentry deferred

---

## Conventions worth keeping

- **Audit-subagent pattern.** After each phase commits, dispatch a `general-purpose` subagent with `run_in_background: true` to audit against the plan; append to `docs/polish-todo.md`. The subagent should NOT see this session's reasoning — it's independent eyes.
- **Continuous-checkpoint commits.** Phase N ships → commit → start Phase N+1. Audit findings land as Phase N.5 commits.
- **Manual steps documented.** `SETUP.md` is the single source for "what the user must do in dashboards" (Supabase auth toggles, env vars, redirect URLs).
- **Pre-RPC RLS check.** Every server action either uses an Auth-aware client (RLS enforced) OR a SECURITY DEFINER function (with explicit caretaker_user_id checks). Never plain service role from a server action.
- **Don't echo Supabase error messages to users.** Map known patterns; otherwise generic "couldn't do X". Log details server-side only.

---

## Incidents observed in real use

**2026-05-20: First beta caretaker locked out of their account.**

User signed up via `/signup`, got "Invalid email or password" on subsequent login attempts. Forensic findings:

1. **`auth.users.email_confirmed_at` was NULL** — the manual Supabase dashboard step (disable "Confirm email") was NEVER done. Signup created the user but Supabase refused to issue a session.
2. **`auth.audit_log_entries` is empty across the whole project** — Supabase audit logging is OFF by default on free tier. Zero forensic trail for failed login attempts.
3. **After fixing #1 via SQL (`UPDATE auth.users SET email_confirmed_at = now()`), login STILL failed.** Means the password was genuinely wrong too (likely autofill/typo mismatch between signup and login).
4. **Fix:** ran `node scripts/reset-password.mjs --email <addr>` (new tool, see below) → temp password → user logged in successfully → first session created.

**What this changes going forward:**
- `scripts/reset-password.mjs` exists as the canonical recovery tool (NOT raw SQL).
- `loginAction` + `signupAction` now show the real Supabase error message in `NODE_ENV=development` so co-developers running locally can self-diagnose. Production still shows the uniform message.
- SETUP.md's "disable email confirmation" step is now critical-path — needs to be done before any signup, not just suggested.
- Action item still open: enable Supabase audit logging in Dashboard → Settings → Auth → Logs so the NEXT incident has a forensic trail.

## Admin recovery tooling

```
node scripts/reset-password.mjs --email <addr> [--password <pwd>]
```

Calls `supabase.auth.admin.updateUserById` via service role. If `--password` omitted, generates a random temp like `PigTemp-f94354bd-Reset!` and prints once. Also `email_confirm: true` as a side effect — fixes both the "email unconfirmed" AND "forgotten password" cases in one call.

Reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. No new deps (uses `@supabase/supabase-js` already installed).

## Things that surprised me (would have saved time to know upfront)

- Supabase CLI's `supabase login` needs a real TTY — won't work from Claude Code's bash. Use `--token` flag with a PAT from https://supabase.com/dashboard/account/tokens.
- React 18 in Next 14 means `useActionState` (React 19) won't compile; use `useFormState` from `react-dom`.
- Supabase nested select returns arrays even for FK-defined 1:1 relations. Coerce: `(Array.isArray(x) ? x[0] : x) ?? null`.
- Supabase free tier email is rate-limited (~4/hour shared SMTP); fine for trickle, breaks at bulk-invite.
- shadcn `<Dialog>` works fine but `state.success && setOpen(false)` during render warns in strict mode — use `useEffect`.
- Migration history can drift if you wipe migration files; `supabase migration repair --status reverted <ts>` fixes it.
- `next/font/google` would be better than CSS `@import` for fonts (P2 in polish-todo).

---

## What I'd attack first next session

Three real paths depending on founder posture:

**Path A — finish v1 (Phase 8 + 9):** Sunday digest then Settings/export/soft-delete UI. ~2-3 hours CC total. Closes the v1 plan. Then we can call v1 "done" and move to post-launch discovery work. Phase 8 spec is in `docs/PHASE-6-9-SPEC.md` § Phase 8 (ISO week vs Sun-Sat is the main footgun; spec says compute bounds in JS, don't reuse `v_weekly_digest`).

**Path B — start v1.1 discovery work in parallel:** Read `docs/DISCOVERY-ROADMAP.md` for the post-v1 plan. My recommendation in that doc is **posture B (Wait-a-Week + digest prompts)** as the highest-leverage post-launch additions. Wait-a-Week is the single most important behavioral mechanic the product is currently missing (Lieber's strongest critique of where v1 is structurally wrong). Could ship in ~1.5 days CC.

**Path C — live-DB test harness:** Set up a test caretaker pattern or `supabase start` local stack so we can finally run the RLS / cascade / FK ordering / trigger security / funder race tests the plan called for. Unblocks all the deferred Vitest work (carried-forward P0 across Phases 1-7). 2-4 hours CC. Compounding payoff but no shippable user value.

My lean: **A then B.** Close v1 cleanly so it can graduate from "beta in progress" to "v1 shipped," then immediately start Wait-a-Week so the product gets its single most distinctive behavioral feature before more caretakers land.
