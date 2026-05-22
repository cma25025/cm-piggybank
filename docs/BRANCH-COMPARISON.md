# Branch comparison — `claude/review-next-session-md-0EPfc` vs `main`

Generated 2026-05-22. Read before any cherry-pick decisions.

## TL;DR

Two parallel Claude sessions built Phase 6 + 7 + audit fixes from the same
parent (`6a94b7f`). Their work has **clear wins** I should port; **one real
product decision** to evaluate; and **a handful of restructures** that are
stylistic. My branch has unique strategic docs + admin tooling that don't
exist on theirs.

**Action: cherry-pick the wins (tests, helper modules, two schema bug fixes,
a state-effect-deps bug), defer the product decision to user, keep main as
canonical.**

---

## Their commits

```
ba2a6cf  Phase 6: Funders screen (parallel implementation)
a70d19f  Phase 6 audit findings appended to polish-todo
6fbd20e  Phase 6.5: fix audit P1s (voided in view, RPC relationship, ILIKE escape)
ec74028  Phase 7: reconciliation nudge (parallel implementation)
a6d7d16  Phase 7 audit findings appended to polish-todo
e9c164e  Phase 7.5: fix audit P1s (dialog success effect, calendar-day staleness)
a5bc04e  Spend UX revamp ← PRODUCT DECISION needed
```

## Cherry-pick decisions per file

### ✅ KEEP — pure wins (cherry-pick straight or with minor adapt)

| Their file | Status on main | Action |
|---|---|---|
| `src/lib/activity/emoji.ts` + `.test.ts` (95 test lines) | Inline duplicated `pickEmoji()` in `recent-activity.tsx` + `activity/page.tsx` | Add their module; refactor both call sites to import |
| `src/lib/funders/aggregate.ts` + `.test.ts` (83 test lines) | Same logic exists inline in `queries.ts:getTopFundersThisMonth` | Extract aggregation to their pure module; queries.ts becomes a thin wrapper |
| `src/lib/reconcile/staleness.ts` + `.test.ts` (71 test lines) | My `daysSince()` is wall-clock-naive — this was a documented but unfixed P1 | Replace my `daysSince` with their `computeStaleness` |
| `src/lib/funders/schemas.test.ts` (78 lines) | No tests for funder schemas on main | Pure addition |
| `src/lib/reconcile/schemas.test.ts` (82 lines) | No tests for reconcile schemas on main | Pure addition |

**Why all wins:** these are pure helpers with no UI coupling. The tests close the carry-forward Vitest P0 from every audit. Total new test coverage: ~409 lines, **bringing us from 15 passing cases to ~49** if their tests adapt cleanly.

### ✅ KEEP — schema bug fixes (real bugs in main)

| Their fix | The bug in main | Severity |
|---|---|---|
| `v_funder_stats` view filters `t.voided_at IS NULL` in the LEFT JOIN | Voided parent deposits still count in `total_contributed_cents` and `deposit_count` on /funders + /funders/[id]. Disagrees with FunderWidget which already filters voided at query layer | P1 — Funders page lies |
| `find_or_create_funder` backfills `relationship` when existing row's value is NULL | Caretaker adds "Grandma", adds "Grandma" again with "mom's mom" → relationship silently dropped | P2 — UX papercut |
| `escapeLike()` on collision pre-check (escapes `%` and `_`) before ilike | Caretaker named "100% Grandma" or "Auntie_M" gets false-positive collision matches | P2 — edge case |

**Action:** write a new migration `20260522_audit_carryforward_fixes.sql` that combines the view fix + RPC update. Cherry-pick the `escapeLike` to my `editFunderAction` / `unarchiveFunderAction`.

### ✅ KEEP — JavaScript bug fixes (real bugs in main)

| Their fix | The bug in main | Where |
|---|---|---|
| `useEffect` deps `[state]` instead of `[state.success]` on success-close pattern | Second consecutive successful dialog submission doesn't auto-close (primitive `true === true` short-circuits effect rerun) | `src/app/activity/void-button.tsx`, my `reconcile-dialog.tsx`, my `funder-row.tsx` dialog effects, `add-funder-button.tsx` |
| Zero-diff reconciliation: drop sign + use muted text for $0.00 | Renders as "− $0.00" which is silly | `recent-activity.tsx`, `activity/page.tsx` |

**Action:** apply both inline to my files.

### ❓ EVALUATE — Spend UX revamp (real product decision)

Their commit `a5bc04e` says:
> Product clarification from the user: a subcategory is a goal / sub-budget the caretaker SETS, not a partition of the bucket total. Spending should gate on the bucket's balance — the actual cash available — and the subcategory is an optional label on the transaction row for tracking goals.

**What this changes:**

1. **Schema:** `log_spend(p_subcategory_id, …)` → `log_spend(p_bucket_id, p_subcategory_id NULL, …)`. Gates on `bucket.balance_cents` (not sub balance). Sub becomes optional metadata.
2. **`/log-spend`:** redesigned as bucket-picker tiles → form filtered to selected bucket → sub picker is tiles with "No goal — just the category" option. URL-deep-linkable via `?bucket=spend|save|share`.
3. **Bucket detail pages** get a "− Log spend" button in the header.
4. **Dashboard CTA row** rebalanced to grid-2 with Add Money + Log Spend equal-weight.

**Where this is right:** For the **Spend bucket**, totally right. Real cash is in the Spend jar; subs are pedagogy labels ("$6 on Treats"). Gating spends on sub-balance was over-modeled — a kid who spent $6 on something that didn't fit any existing sub had no place to log it.

**Where this is potentially wrong (the user decision):** For the **Save bucket**, subs ARE goals (Lego, Beach Vacation). If the kid says "I want to spend $20 from my Lego Save," and Lego goal only has $15 but Save bucket has $50, should the RPC allow it? **Their revamp says yes** (gates on bucket only). My v1 PRD-aligned model says no (gates on sub). Same for Share bucket where subs ARE recipients.

**There's a real philosophical split:**
- **"Bucket is the budget" model (theirs):** simpler, matches physical cash reality, kid can re-allocate
- **"Sub is the budget when set" model (PRD §5.3):** stricter, honors goal allocations, prevents accidental drain

The Lieber discovery roadmap leans **toward stricter goals** ("patience as a learnable virtue"). Wait-a-Week + goal photos all assume Save subs are real budgets. Loosening to "bucket only" undermines that pedagogy.

**Recommendation: discuss with user. Three real choices:**
- A) Adopt the revamp wholesale (sub is always optional, bucket-gated)
- B) Adopt the UX (bucket-first picker, optional sub) but keep sub-balance check for Save+Share buckets (where subs are goals)
- C) Reject the revamp; keep current strict sub-required model

### ❓ EVALUATE — ReconcileDialog mount strategy

Their version always-mounts on /dashboard with `?reconcile=open` URL search param driving open state. Mine mounts on demand inside the banner.

**Theirs wins for deep-linking** (Phase 9 Settings → "Reconcile now" link will work without re-mounting; cross-page deep links work). Mine is simpler but breaks deep-link.

**Action:** port their mount strategy when we wire Phase 9's settings page. For now, mine is fine.

### ❌ SKIP — no clear improvement

| Their version | Why skip |
|---|---|
| Their `editFunderAction` / `unarchiveFunderAction` / `addFunderAction` | Same logic as mine, slightly different wording. No win after I cherry-pick the `escapeLike` and `voided_at` fixes |
| Their reconcile-dialog file location (`src/components/dashboard/` vs my `src/app/reconcile/`) | Both work. Theirs reads more like "dashboard component"; mine reads more like "route-co-located form." Stylistic |
| Their migration filenames (`20260518000300`, `20260518000400`, `20260518000500`) | Earlier timestamps because they started parallel earlier in clock time. Mine work fine. Renaming creates churn for no gain |

### ❌ MUST PRESERVE — files only on main

These don't exist on the divergent branch and are unique value:

- `docs/DISCOVERY-ROADMAP.md` (235 lines) — post-v1 product planning
- `docs/OPPOSITE-OF-SPOILED-NOTES.md` (117 lines) — research artifact
- `scripts/reset-password.mjs` (143 lines) — admin recovery tool
- `src/app/page.tsx` landing page rewrite (their version has the old "Phase 0 scaffold")
- Dev-mode auth error verbosity in `signup/actions.ts` + `login/actions.ts`
- `docs/PHASE-6-9-SPEC.md` + `docs/NEXT-SESSION.md` (theirs has older versions)

---

## Salvage plan (concrete)

If user approves this plan, execute in this order:

1. **New migration `20260522000000_audit_carryforward_fixes.sql`** — combines:
   - `v_funder_stats` voided_at filter (cherry-pick from `20260518000300`)
   - `find_or_create_funder` relationship backfill (cherry-pick from `20260518000300`)
   - Add `escapeLike()` helper in TS, use in `editFunderAction` + `unarchiveFunderAction`

2. **Add their 5 test files** to main:
   - `src/lib/activity/emoji.ts` + `emoji.test.ts`
   - `src/lib/funders/aggregate.ts` + `aggregate.test.ts`
   - `src/lib/funders/schemas.test.ts`
   - `src/lib/reconcile/schemas.test.ts`
   - `src/lib/reconcile/staleness.ts` + `staleness.test.ts`

3. **Refactor my code to use the new helpers:**
   - `recent-activity.tsx` + `activity/page.tsx` import `pickActivityEmoji`
   - `lib/funders/queries.ts:getTopFundersThisMonth` calls `aggregateTopFunders`
   - `lib/reconcile/queries.ts:daysSince` removed; banner uses `computeStaleness`

4. **Apply JS bug fixes:**
   - Dialog effect deps from `[state.success]` → `[state]` in 4 files
   - Zero-diff reconciliation `− $0.00` rendering fix in activity rows

5. **Verify:** typecheck + build + `npm test` (should jump from 15 → ~49 passing cases)

6. **Defer the Spend UX revamp** to a separate decision (commit doesn't ship until user picks A/B/C above)

7. **Delete origin branches:**
   ```bash
   git push origin --delete claude/review-next-session-md-0EPfc
   git push origin --delete claude/setup-mobile-repo-access-CUXjG
   ```

8. **Update `docs/NEXT-SESSION.md`** noting the salvage happened.

**Estimated effort: ~45 min CC. No conflicts with main since cherry-picks are additive or are pure-replacement of inline-only code I wrote.**

## What I'd NOT salvage even though it's tempting

- **Their Phase 6/7 page implementations.** They're parallel implementations of the same UX. Re-applying would mean re-doing my work for no win.
- **Their migration naming convention.** Renaming creates DB-history churn (would need migration-repair on the remote). Mine work; live with the inconsistency.
- **Their always-mount reconcile dialog.** Wait for Phase 9 settings work to land then revisit if needed.
