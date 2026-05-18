# Next Session — Handoff for the Next Claude Code

**Last updated:** 2026-05-18 — through Phase 5 re-audit fixes (void lineage, etc.)
**Current state:** Phases 0–5 + 4 audit-fix passes shipped. Production on Vercel. Schema live in Supabase (4 migrations). Phase 6-9 specs ready in `docs/PHASE-6-9-SPEC.md`.

---

## TL;DR

A working v1 beta of CM Piggybank is on `main`. ~6,500 lines TS/TSX, 19 routes, 4 migrations. A caretaker can sign up → walk through 4-step onboarding → use the dashboard → add money / log spends / void mistakes. Three sidebar items are placeholder pages (`/funders`, real `/settings`, three `/coming-soon/*`) — those are Phases 6–9. Live-DB integration tests are still missing.

---

## Where things stand right now

| Layer | State |
|---|---|
| **GitHub** | `cma25025/cm-piggybank` main, 11 commits ahead of original v0 |
| **Vercel** | Auto-deploys on push; project `cm-piggybank` (`prj_ivgoHOYF2cSqYazxECU7Th0SBvQ7`) |
| **Supabase** | Project `supabase-fulvous-arrow` (ref `scuxpypcxwlyyfgovncf`), all 3 migrations applied |
| **Local dev** | `npm run dev` boots; `npm test` passes (15/15 distribution math) |
| **CLI auth** | Supabase CLI logged in via PAT (rotate the one in transcript before public release) |

Recent commits (oldest → newest):
```
58dec31  Phase 0: teardown + tooling install
eb77d1b  Phase 1: v1 schema + RLS + triggers + RPCs + distribution tests
8144d1e  Phase 1.5: fix audit P0s in v1 schema
d24a911  Phase 2: auth + password reset + protected routes
42213e7  Phase 2: auth + password reset + protected routes  (dup commit, msg rewrite)
107676e  Phase 2.5: fix audit P0s + critical P1s in auth flow
c719fa2  Phase 3: onboarding wizard (4 steps with Y-fork)
123957f  Phase 4: app shell + dashboard slots + buckets + activity + coming-soon
65f3162  Phase 4.5: fix activity 4-row deposit rendering + sub-management type
da86900  Phase 5: Add Money + Log Spend + Void
fdbce4a  Append Phase 5 self-review findings to polish-todo
79386f7  Phase 5 hotfix: spend FOR-UPDATE RPC + void useEffect + timezone fix
c0a5d02  Add NEXT-SESSION.md handoff + fix landing page CTA
[next]   Phase 5.6: void lineage column + activity filter + re-audit small fixes
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

**Production:** check the Vercel dashboard for the active prod URL (likely `https://cm-piggybank.vercel.app` or a preview alias). GitHub Deployments tab shows the latest production deploy hash; it should match `79386f7`.

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
| 2. Auth + password reset | ✅ done | + 2.5 audit fixes |
| 3. Onboarding wizard | ✅ done | |
| 4. Dashboard + Buckets + Activity + Coming-soon | ✅ done | + 4.5 audit fixes |
| 5. Add Money + Log Spend + Void | ✅ done | + 5 hotfix (RPC, useEffect, timezone) |
| 6. Funders screen | ⏳ next | placeholder shipped; real screen TBD |
| 7. Reconciliation nudge | ⏳ next | uses `Dashboard.banner` slot |
| 8. Sunday digest | ⏳ next | uses `Dashboard.ctaRow` slot |
| 9. Settings + JSON export + soft-delete UI | ⏳ next | |

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

Both background subagents from the prior session landed and their outputs are committed:
- Phase 5 re-audit → `docs/polish-todo.md` (the void lineage P1 it caught is already FIXED in Phase 5.6)
- Phase 6-9 specs → `docs/PHASE-6-9-SPEC.md`

So:

1. **Read `docs/PHASE-6-9-SPEC.md` Phase 6 section.** It has the file list, queries, slot integration pattern.
2. **Build Phase 6 — Funders.** ~30-60 min. Replace `src/app/funders/page.tsx` placeholder with the real list + per-funder detail + `FunderWidget` for the dashboard slot. Uses already-shipped `v_funder_stats` view.
3. **Dispatch fresh Phase 6 audit subagent in background** as the commit lands. Same pattern as Phases 1-5.
4. **OR Live-DB test harness** if you want to invest in compounding signal before more features. Bigger lift but unblocks all the deferred Vitest work.

After Phase 6, Phases 7 + 8 can ship in parallel worktrees per the v1 plan §8 (parallel-safe; each fills a different dashboard slot). Phase 9 is the cleanup + polish phase.
