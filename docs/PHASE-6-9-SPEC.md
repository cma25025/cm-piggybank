# Phases 6-9 — Implementation Specs

> Generated 2026-05-18 by planning subagent after Phase 5 hotfix. Each phase is
> independently shippable; recommended order is 6 → 7 → 8 → 9 (per the v1 plan
> worktree strategy — Phases 6/7/8 are parallel-safe after Phase 5).
>
> Each phase ends with an audit-subagent dispatch against its acceptance
> criteria; findings append to `docs/polish-todo.md` under a `## Phase N`
> header. Pattern: build → commit → fresh subagent audit → triage P0 before
> next phase.

---

## Phase 6 — Funders Screen

**Goal:** Caretaker manages funders as a first-class surface: list with
per-funder stats, history per funder, add/edit/archive flows, and a top-3
contributors widget on the dashboard.
**Estimated effort:** ~45-60 min CC

### Files to create

- `src/lib/funders/queries.ts` — `getFunderStats(piggybankId)` selects from
  `v_funder_stats`; `getFunderHistory(piggybankId, funderId)` selects parent
  deposits only (`.is("parent_id", null).eq("funder_id", funderId)`);
  `getTopFundersThisMonth(piggybankId, limit=3)` aggregates from `transaction`
  filtered `kind='deposit' and parent_id is null and occurred_at >= date_trunc('month', now())`.
- `src/app/funders/page.tsx` — REPLACE placeholder. Server component, lists
  active funders sorted by `total_contributed_cents desc`; archived in a
  collapsed `<details>` below. Each row → link to `/funders/[id]`.
- `src/app/funders/[id]/page.tsx` — Server component, per-funder header
  (display_name, relationship, total contributed, deposit count, last
  contribution), history table of parent deposits (date, amount, source_type,
  note) with auto-distribution preview on hover (later).
- `src/app/funders/funder-row.tsx` — Client component. Renders one row in the
  list with an edit/archive dropdown menu (shadcn `DropdownMenu`); opens
  shadcn `Dialog` with `useFormState` form bound to `editFunderAction` or
  `archiveFunderAction`.
- `src/app/funders/add-funder-button.tsx` — Client component, shadcn `Dialog`
  trigger. Reuses Phase 3 step-3 add-funder form pattern; calls
  `addFunderFromFundersPageAction`.
- `src/app/funders/actions.ts` — `editFunderAction`, `archiveFunderAction`,
  `addFunderFromFundersPageAction`. All Zod-validated, all `revalidatePath`
  the funders list + dashboard.
- `src/components/dashboard/funder-widget.tsx` — Server component. Calls
  `getTopFundersThisMonth`; renders top 3 as small cards. Fills
  `Dashboard.widgets` slot (`dashboard.tsx:14`).
- `src/lib/funders/schemas.ts` — Zod schemas: `EditFunderSchema`
  (`display_name` trim + min(1) + max(80), `relationship` optional max(40)),
  `AddFunderSchema` (same shape).

### Files to edit

- `src/app/dashboard/page.tsx` — pass `<FunderWidget piggybankId={...} />`
  to `<Dashboard widgets={...}>`. Wrap server fetch in `React.cache()`
  alongside `getDashboardData` (carries Phase 4 P1 fix).
- `src/app/funders/page.tsx` — drop unused `COMING_SOON` import (Phase 4 P1).
- `src/app/add-money/add-money-form.tsx` (if exists; otherwise the existing
  funder autocomplete) — already integrated in Phase 5; no change needed,
  just verify the autocomplete still reads from active funders only.

### Schema queries

```ts
// queries.ts — all four operate under caretaker JWT; RLS scopes
supabase.from("v_funder_stats")
  .select("*")
  .eq("piggybank_id", piggybankId)
  .order("total_contributed_cents", { ascending: false });

supabase.from("transaction")
  .select("id, amount_cents, occurred_at, source_type, note")
  .eq("piggybank_id", piggybankId)
  .eq("funder_id", funderId)
  .eq("kind", "deposit")
  .is("parent_id", null)
  .order("occurred_at", { ascending: false })
  .limit(100);

supabase.from("transaction")
  .select("funder_id, amount_cents, funder:funder_id(display_name)")
  .eq("piggybank_id", piggybankId)
  .eq("kind", "deposit")
  .is("parent_id", null)
  .gte("occurred_at", monthStartIso)
  // aggregate client-side into Map<funderId, sumCents>, take top 3
```

### UI per page

- **`/funders`**: page head ("Funders — who's contributing"), `AddFunderButton`
  top-right. List uses `Card` shells matching the bucket-card aesthetic
  (`rounded-2xl border border-line-soft bg-card`). Per-row: avatar bubble
  (first codepoint of `display_name`), name + relationship subtitle, right side
  shows `formatCents(total_contributed_cents)` + "N deposits" + "last:
  {date}". `DropdownMenu` with Edit / Archive. Archived list in
  `<details>` collapse at bottom, dimmed.
- **`/funders/[id]`**: page head with funder name, relationship pill, total
  contributed in display font (matches `TotalCard` aesthetic). Below: history
  table — Date / Amount / Source / Note columns. Mobile: card list. Empty
  state: "No deposits from {name} yet."
- **`FunderWidget`** (dashboard slot): heading "Top contributors this month",
  3 stacked small cards (`px-3 py-2`), each showing avatar + name + amount.
  Empty state: hide widget entirely (return `null`) if no deposits this month.

### Dashboard slot integration

```tsx
// src/app/dashboard/page.tsx
import { FunderWidget } from "@/components/dashboard/funder-widget";
// ...
<Dashboard
  data={data}
  widgets={<FunderWidget piggybankId={data.piggybankId} />}
/>
```

`FunderWidget` returns `null` when empty so the dashboard layout doesn't
gain dead space. Phase 7/8 augment `banner` and `ctaRow` independently.

### Acceptance criteria

- `/funders` lists active funders sorted by total contributed desc; archived
  funders hidden behind `<details>` collapse.
- Stats numbers (total, count, last date) match a hand-computed `SELECT
  sum(amount_cents), count(*), max(occurred_at) FROM transaction WHERE
  funder_id = X AND kind='deposit' AND parent_id IS NULL`.
- Edit funder updates `display_name` and `relationship`; trim runs server-side;
  case-insensitive dup detection (rejects "Grandma" if "grandma" exists).
- Archive funder sets `archived_at = now()`; archived funder disappears from
  Add-Money picker (Phase 5) and Funders list active section but persists in
  activity log and `/funders/[id]` history.
- Cannot delete funder with txns (UI offers Archive only — DB also has
  `ON DELETE RESTRICT` on `transaction.funder_id`).
- `/funders/[id]` shows parent deposits only (no triple-counting children).
- Dashboard `FunderWidget` shows top 3 contributors of current month;
  matches `select funder_id, sum(amount_cents) from transaction where ...
  group by funder_id order by sum desc limit 3`.
- Vitest: `getTopFundersThisMonth` aggregation helper covered; archive
  schema validation covered.

### Risks / footguns

- **Triple-counting**: every query against `transaction` for funder stats
  must filter `parent_id IS NULL` AND `kind='deposit'`. Children carry
  `funder_id` (denormalized in Phase 1) for filter speed; summing them
  multiplies by 3x. The `v_funder_stats` view does this correctly
  (migrations:551-554); replicate the pattern in the month-aggregate query.
- **Archived funders polluting `v_funder_stats`**: Phase 1 audit P1 flagged
  this — view returns archived rows with zero stats. Filter
  `where archived_at is null` at query time in `getFunderStats`; the
  archived list uses a separate query without that filter.
- **Codepoint-aware initials**: emoji-prefixed names ("🎄 Grandpa") break
  with `name[0]` (Phase 3 P1 finding). Use `[...name][0]?.toUpperCase()`.
- **Edit funder case-insensitive collision**: edit action must guard against
  renaming "Grandma" → "grandma" (no-op for the partial unique index since
  `lower()` matches, but worth catching at the action layer with a friendly
  message instead of letting Postgres raise `23505`).
- **`React.cache` on top-funders query**: dashboard re-renders shouldn't
  re-fetch. Same pattern as Phase 4 dashboard query cache (deferred fix from
  Phase 4 P1).

---

## Phase 7 — Reconciliation Nudge

**Goal:** Caretaker reconciles the jar vs the app weekly. Banner appears when
`max(occurred_at) where kind='adjustment' and note like 'Reconciled%'` is
>7 days ago. "Check the jar" flow writes an adjustment with a reason.
**Estimated effort:** ~30-45 min CC

### Files to create

- `src/lib/reconcile/queries.ts` — `getLastReconcileAt(piggybankId)` —
  `SELECT max(occurred_at) FROM transaction WHERE piggybank_id=$1 AND
  kind='adjustment' AND note LIKE 'Reconciled:%'`. Returns `Date | null`.
- `src/app/reconcile/actions.ts` — `recordReconciliationAction`. Zod:
  `actual_total_cents` (int >= 0), `reason` (enum: "rounding", "cash_missing",
  "found_cash", "miscount", "other"), `note` (max 200, optional). Computes
  `diff = actual - piggybank.total_balance_cents`; if `diff === 0`, writes
  a `kind='adjustment'` row with `amount_cents = 0` (CHECK accepts adjustment
  with non-zero only — special-case: write `note='Reconciled: no change'`
  but no transaction; just update a `last_reconcile_at` server-state via
  a tiny `last_event` row, OR allow zero adjustment by adjusting the CHECK).
  Simpler: skip txn write if diff=0, store reconciliation timestamp in a
  small `_meta` row (kind='opening_balance' amount=0 with note 'Reconciled')
  OR rely on `kind='adjustment'` with amount=$0.01 to spend (no — pollutes).
  **Decision:** allow zero-diff reconciliation by relaxing CHECK
  `amount_sign_rules` for `kind='adjustment'` to `amount_cents IS NOT NULL`
  (drop `<> 0`); document in migration.
- `src/components/dashboard/reconcile-banner.tsx` — Server component. Calls
  `getLastReconcileAt`; if `null` or older than 7 days, renders banner with
  "Check the jar" button → opens reconcile modal. Otherwise returns `null`.
- `src/app/reconcile/reconcile-dialog.tsx` — Client component. shadcn `Dialog`
  with `useFormState` form: actual total input (dollars, converts to cents
  server-side), live "diff: +$X.XX / -$X.XX" preview, reason radio, optional
  note, submit. Success closes dialog and `revalidatePath('/dashboard')`.
- `src/components/dashboard/reconcile-trigger-button.tsx` — Client; the "Check
  the jar" button that mounts inside `ReconcileBanner` and toggles dialog open
  state via URL search param (`?reconcile=open`) so server-rendered banner
  can include a dialog opener.
- `supabase/migrations/<ts>_phase7_reconcile.sql` — relax
  `amount_sign_rules` CHECK to allow `kind='adjustment' AND amount_cents
  IS NOT NULL` (drops the `<> 0` clause).
- `src/lib/reconcile/schemas.ts` — Zod `ReconcileSchema`.

### Files to edit

- `src/app/dashboard/page.tsx` — pass
  `<ReconcileBanner piggybankId={...} />` to `<Dashboard banner={...}>`.
- `src/app/settings/page.tsx` (Phase 9 creates this — flag in Phase 9 spec
  to include a "Reconcile now" link that opens the same dialog).
- `src/components/dashboard/recent-activity.tsx` — already renders
  `kind='adjustment'` rows; ensure note prefix "Reconciled:" gets a distinct
  emoji (⚖️) in `pickEmoji`. Same for `/activity` page emoji helper (Phase 4
  P2 said to hoist the helper — do it here).

### Schema queries

```ts
// queries.ts
supabase.from("transaction")
  .select("occurred_at")
  .eq("piggybank_id", piggybankId)
  .eq("kind", "adjustment")
  .like("note", "Reconciled:%")
  .order("occurred_at", { ascending: false })
  .limit(1)
  .maybeSingle();

// action: write the adjustment
supabase.from("transaction").insert({
  piggybank_id, kind: "adjustment",
  amount_cents: diffCents,  // can be negative, positive, or zero
  bucket_id: spendBucketId,  // adjustment always lands on Spend bucket
  note: `Reconciled: ${reasonLabel}${note ? " — " + note : ""}`,
  occurred_at: new Date().toISOString(),
});
```

### UI per page

- **`ReconcileBanner`**: amber-tinted card (`bg-rose-50 border-rose-200` or
  reuse `bg-brand-soft`), copy "It's been {N} days since you checked the
  jar. Real-world cash drifts — let's reconcile.", right-aligned "Check the
  jar" button.
- **Reconcile dialog**: shadcn `Dialog`, title "Check the jar",
  description "Count what's actually in the jar and we'll record any drift",
  input "Actual total in jar ($)" (number with step=0.01), live diff
  display (green/red), reason radio group (5 options), optional note textarea,
  Submit / Cancel buttons.
- **Activity log**: adjustment rows render with ⚖️ emoji + "Reconciled: {reason}"
  title (use existing recent-activity formatting).

### Dashboard slot integration

```tsx
<Dashboard
  data={data}
  banner={<ReconcileBanner piggybankId={data.piggybankId} />}
  widgets={<FunderWidget piggybankId={data.piggybankId} />}
/>
```

`ReconcileBanner` returns `null` when last reconcile < 7 days, so the
dashboard auto-hides the banner without empty space.

### Acceptance criteria

- Banner appears when no reconciliation in the last 7 days; hides when one
  was recorded within 7 days.
- Reconciliation writes a `kind='adjustment'` transaction with
  `note LIKE 'Reconciled:%'`; bucket and piggybank balances update via the
  Phase 1 trigger.
- Zero-diff reconciliation still records the event (after CHECK relaxation).
- Diff math: `actualCents - piggybank.total_balance_cents` (in action,
  re-fetch the current total to avoid stale form state).
- Activity log shows reconciliation rows distinctly (⚖️ emoji).
- "Reconcile now" link in Settings opens the same dialog (Phase 9 wires).
- Vitest: schema validation, diff computation pure function, CHECK relaxation
  migration applies cleanly.

### Risks / footguns

- **CHECK constraint relaxation**: dropping `<> 0` on adjustment requires a
  new migration; the migration must use `alter table public.transaction
  drop constraint amount_sign_rules; alter table public.transaction add
  constraint amount_sign_rules check (...)` with the new predicate. Test
  locally on a snapshot before pushing.
- **Bucket choice for adjustment**: drift could be spread across all 3
  buckets, but v1 lands it on Spend (closest to "real cash that drifted").
  Document this in the dialog copy ("We'll log this against the Spend
  bucket"). Phase 9 polish: per-bucket reconciliation if signal demands.
- **Stale total in diff**: form must re-read `piggybank.total_balance_cents`
  server-side at submit time, not trust a hidden form field. Caretaker who
  leaves the modal open while another tab logs a spend would otherwise
  reconcile against a stale total.
- **Banner threshold**: 7 days is calendar days, not 7 * 86400 seconds. Use
  `now() - last < interval '7 days'` semantics in the query, not a JS
  subtraction (timezone surprises).
- **TOCTOU on diff write**: low-stakes for v1 (single caretaker), but the
  same `FOR UPDATE` lesson from Phase 5 P0 applies. Defer; flag in audit.

---

## Phase 8 — Sunday Digest

**Goal:** Caretaker generates a printable one-page weekly summary of money
movement, sentimental copy, top spends. `@media print` styles + a CTA button
on the dashboard.
**Estimated effort:** ~45-60 min CC

### Files to create

- `src/lib/digest/queries.ts` — `getDigestData(piggybankId, isoWeek)`. ISO
  week format `YYYY-Www`. Returns `{ weekStart, weekEnd, totalCents,
  weeklyDelta, depositsIn, spendsOut, topSpends: Array<{name, amount, emoji}>,
  goalProgress: Array<{subName, balance, target, pct}>, kidName }`.
- `src/lib/digest/copy.ts` — `pickHeadline(data)` returns warm copy based on
  delta sign and magnitude ("Big week, {name}! +$X" / "Steady as she goes" /
  "Light week — that's okay too"). 5-8 templates per bucket.
- `src/lib/digest/iso-week.ts` — `currentIsoWeek()`, `parseIsoWeek(str)`,
  `weekBounds(isoWeek)` → `{ start: Date, end: Date }`. Sunday-start week
  per Phase 1 P2 finding (digest is Sun-Sat, NOT ISO Mon-Sun).
- `src/app/digest/[week]/page.tsx` — Server component, route param is `YYYY-Www`
  (`2026-W20`). Fetches digest data, renders the one-page layout. No
  `AppShell` wrap (full-bleed page for print).
- `src/app/digest/[week]/digest-print-button.tsx` — Client component;
  triggers `window.print()`.
- `src/components/dashboard/digest-cta.tsx` — Client component "Print this
  week's digest" button that opens `/digest/{currentIsoWeek}` in a new tab.
- `src/app/digest/[week]/digest.css` (or extend `globals.css`) — `@media
  print` rules: hide sidebar/nav, single letter-page, ensure colors render
  (`-webkit-print-color-adjust: exact`), force page break after header.

### Files to edit

- `src/app/dashboard/page.tsx` — augment `ctaRow` slot. Existing
  `DefaultCtaRow` has Add Money / Log Spend; add Digest button alongside.
  Pattern: build a `<DigestAugmentedCtaRow />` that renders default CTAs + the
  digest button.
- `src/components/dashboard/default-cta-row.tsx` — refactor to accept
  `extras?: React.ReactNode` slot for the digest CTA, or create a new
  `dashboard-cta-row.tsx` that composes the three.

### Schema queries

```ts
// queries.ts — use v_weekly_digest but the view date_trunc is ISO Mon-Sun
// (Phase 1 P2). Either rewrite the view to Sun-start or compute in JS.
// Recommended: bypass the view, query raw transaction with explicit week bounds.
supabase.from("transaction")
  .select("kind, amount_cents, occurred_at, bucket_id, subcategory:subcategory_id(display_name, emoji)")
  .eq("piggybank_id", piggybankId)
  .gte("occurred_at", weekStart.toISOString())
  .lt("occurred_at", weekEnd.toISOString())
  .order("occurred_at", { ascending: true });

// Aggregate in JS:
// - depositsIn = sum(amount_cents where kind='deposit' and parent_id IS NULL)
// - spendsOut = sum(amount_cents where kind='spend')
// - topSpends = top 3 spends by amount, mapped to subcategory display
// - goalProgress: separate query against subcategory where target_amount_cents IS NOT NULL
```

### UI per page

- **`/digest/[week]`**: One letter page. Header: kid avatar + name + "Week of
  {weekStartLabel}". Big total card (mockup-faithful, `font-display text-6xl`).
  Three columns: "This week's deposits" (depositsIn), "This week's spends"
  (spendsOut), "Change this week" (weeklyDelta with sign). Top 3 spends
  section with emoji + sub name + amount. Goal progress bars (shadcn
  `Progress` from Phase 0 P1 install list). Footer warm copy from
  `pickHeadline`. Print button (hidden on print).
- **Dashboard CTA**: small button "Print this week's digest" alongside Add
  Money / Log Spend.
- **`@media print`**: `.sidebar`, `.no-print`, `<header>` of AppShell hidden;
  `body { background: white; }`; force single page.

### Dashboard slot integration

```tsx
<Dashboard
  data={data}
  banner={<ReconcileBanner piggybankId={data.piggybankId} />}
  widgets={<FunderWidget piggybankId={data.piggybankId} />}
  ctaRow={<DashboardCtaRow piggybankId={data.piggybankId} />}
/>
```

`DashboardCtaRow` composes Add Money + Log Spend + Digest into one row.

### Acceptance criteria

- `/digest/2026-W20` renders the digest for that week. Default `/digest`
  (no param) redirects to current ISO Sun-Sat week.
- Numbers match dashboard total card for the same period: `weeklyDelta`
  on `/digest/{current}` equals `totalCard.weeklyDeltaCents` on dashboard.
- Print preview shows one letter-sized page; sidebar/nav hidden; colors
  render in print.
- Top 3 spends are correct (highest 3 `kind='spend'` rows that week);
  goal progress reflects current subcategory balances vs targets.
- Copy is warm and varies based on delta (test all 3 ranges:
  negative, zero, positive-big, positive-small).
- Vitest: `iso-week.ts` helpers (week bounds, parse/format roundtrip);
  `pickHeadline` template selection; aggregation helper.

### Risks / footguns

- **ISO week vs Sun-Sat**: Postgres `date_trunc('week', ...)` is Mon-Sun.
  Plan §C7 says caretaker-friendly Sun-start. Compute bounds in JS:
  `weekStart = previousSunday(date); weekEnd = weekStart + 7 days`. Don't
  reuse `v_weekly_digest` for the digest unless you accept Mon-Sun framing
  (decide and label clearly).
- **Print color rendering**: Chrome/Safari need
  `-webkit-print-color-adjust: exact` AND `color-adjust: exact`. Firefox
  honors the standard `color-adjust`. Test all three before shipping.
- **Timezone for week bounds**: caretaker in PST viewing a digest at 11pm
  Saturday might see Sunday's deposit if server interprets dates in UTC.
  Pass `Intl.DateTimeFormat().resolvedOptions().timeZone` to the digest
  route (e.g. `/digest/2026-W20?tz=America/Los_Angeles`) and use it for
  week bounds; or document UTC and let drift be small.
- **Empty week**: `topSpends` may be empty; `goalProgress` may be empty.
  Render warm empty-state copy ("Quiet week. Sometimes that's the win.")
  not a blank section.
- **No SSR for shareable image (v1.1)**: plan §C7 mentioned this; ship the
  print-only path now, image-export is v1.1.

---

## Phase 9 — Settings + Export + Polish

**Goal:** Loose ends: settings page (kid profile, distribution rule, password
change), JSON export, soft-delete piggybank with typed-confirm, empty/error
states audit, mobile QA, Lighthouse pass.
**Estimated effort:** ~60-90 min CC (largest of the four; can split if needed)

### Files to create

- `src/app/settings/page.tsx` — REPLACE placeholder. Server component;
  3 sections: Kid Profile (form with name, age, emoji), Distribution Rule
  (3 percent inputs, sum=100 validation), Account (password change, export,
  delete).
- `src/app/settings/kid-profile-form.tsx` — Client form; `useFormState` →
  `updateKidProfileAction`.
- `src/app/settings/distribution-form.tsx` — Client form; reuses Phase 3
  step-2 sum-validation pattern; `updateDistributionAction`.
- `src/app/settings/password-form.tsx` — Client form with current + new +
  confirm; `changePasswordAction` calls `supabase.auth.updateUser`.
- `src/app/settings/export-button.tsx` — Client component; `<a download>`
  link to `/api/export` (route handler).
- `src/app/settings/delete-piggybank-dialog.tsx` — Client; shadcn `Dialog`
  with typed-confirm input ("Type DELETE to confirm"), inline link to
  Export. Calls `softDeletePiggybankAction`.
- `src/app/settings/actions.ts` — `updateKidProfileAction`,
  `updateDistributionAction`, `changePasswordAction`,
  `softDeletePiggybankAction` (calls `soft_delete_piggybank` RPC).
- `src/app/api/export/route.ts` — GET route handler; auth-gated; returns
  JSON blob `{ piggybank, kidProfile, distributionRule, buckets,
  subcategories, funders, transactions }` with `Content-Disposition:
  attachment; filename="piggybank-export-{date}.json"`.
- `src/lib/settings/schemas.ts` — Zod schemas for all four forms.
- `docs/beta-onboarding.md` — one-page guide for co-developers.

### Files to edit

- `SETUP.md` — refresh for v1 schema/auth/local-dev flow (Phase 0 P2
  observation; finally close out).
- `src/components/layout/sidebar.tsx` — already has Settings link; verify
  active state highlights.
- `src/components/dashboard/recent-activity.tsx` — once-over for empty
  states + curly apostrophes (Phase 4 P1 finding).
- `src/app/onboarding/step-2/page.tsx` — fix Phase 3 P1 read-back bug
  (load saved rule before rendering).
- `src/middleware.ts` — fix Phase 2 P1 open-redirect (`//evil.com` slip).
- `src/app/forgot-password/actions.ts` — fix Phase 2 P1 operator-precedence
  bug.
- `src/app/login/page.tsx` — render `?error=` query param from middleware
  redirects (Phase 2 P1).
- `src/app/signup/actions.ts` — uniform "Could not create account" error
  to fix Phase 2 P0 enumeration.
- `src/app/reset-password/actions.ts` — require recovery-session check
  (Phase 2 P0).
- `src/lib/onboarding/state.ts` — add `is("deleted_at", null)` filter
  (Phase 3 P0).
- `supabase/migrations/<ts>_phase9_safety.sql` — add
  `unique (caretaker_user_id)` on `kid_profile` (Phase 3 P0); add
  cross-table composite FK guards (Phase 1 P0); add UPDATE policy on
  transaction OR delete the misleading comment (Phase 1 P0); fix
  `void_transaction` `if not found` guard (Phase 1 P0); add idempotency
  check to prevent double-void (Phase 1 P0).

### Schema queries

```ts
// export route
const [pb, kid, rule, buckets, subs, funders, txns] = await Promise.all([
  supabase.from("piggybank").select("*").eq("id", piggybankId).single(),
  supabase.from("kid_profile").select("*").eq("id", kidId).single(),
  supabase.from("distribution_rule").select("*").eq("piggybank_id", piggybankId).single(),
  supabase.from("bucket").select("*").eq("piggybank_id", piggybankId),
  supabase.from("subcategory").select("*").eq("piggybank_id", piggybankId),
  supabase.from("funder").select("*").eq("piggybank_id", piggybankId),
  supabase.from("transaction").select("*").eq("piggybank_id", piggybankId).order("occurred_at"),
]);
return new Response(JSON.stringify({ ... }, null, 2), {
  headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="..."` }
});
```

### UI per page

- **`/settings`**: stacked sections with `border-line-soft` dividers. Kid
  Profile + Distribution + Account. Each section: title + description +
  inline form. Account section: password change form, "Export my data"
  button (downloads JSON), "Delete piggybank" button (red border, opens
  typed-confirm dialog with inline export link).
- **Delete dialog**: copy "This soft-deletes your piggybank. Restorable for
  30 days. Want to export your data first? [Export now]". Typed input
  must equal "DELETE" before submit enables. Submit calls
  `soft_delete_piggybank`, redirects to `/login` after sign-out.

### Acceptance criteria

- All four settings forms submit and persist; field-level errors render
  inline (`fieldErrors`).
- Password change requires current + new + confirm match; new ≥ 8 chars.
- Export downloads valid JSON with all 7 tables; opens cleanly in any JSON
  parser; no secrets (no `caretaker_user_id`, no `auth.users` data).
- Delete piggybank requires typed "DELETE"; soft-deletes via RPC; user is
  signed out and redirected.
- Every Phase 0-5 polish-todo P0/P1 item is closed or explicitly deferred
  with rationale appended to `polish-todo.md`.
- Empty states present on every route (`/funders`, `/activity`,
  `/buckets/[kind]`).
- Error states: every server action wraps try/catch → sanitized
  `console.error` → user-friendly toast.
- Mobile responsive QA at 390px (iPhone SE) and 1280px (laptop).
- Lighthouse on `/dashboard`: a11y ≥ 90, perf ≥ 80.
- `docs/beta-onboarding.md` exists, ≤ 1 page rendered, covers signup URL,
  what to expect, feedback channel, key terms (void / soft-delete / reconcile).
- `SETUP.md` updated for v1 schema + auth + Supabase config.
- Vitest: settings schemas, export shape (snapshot test), distribution
  validation reused from Phase 3.

### Risks / footguns

- **Export contains PII**: kid name + caretaker email is in the export.
  Document that the export is for caretaker's own backup; not safe to
  share verbatim. Consider opt-in redaction toggle in v1.1.
- **Password change invalidates session**: Supabase `updateUser({ password })`
  rotates the JWT — the user's other tabs will 401 on next mutation. Show
  a "you may need to sign in again" toast post-success.
- **Soft delete without restore UI**: the 30-day window is dashboard-only;
  restore requires a Supabase admin SQL `update piggybank set deleted_at
  = null where id = X`. Document the manual restore path in
  `docs/beta-onboarding.md`.
- **Migration safety**: the Phase 9 safety migration touches existing data
  (unique on kid_profile may fail if any caretaker somehow has 2 rows).
  Pre-check: `select caretaker_user_id, count(*) from kid_profile group
  by 1 having count(*) > 1`. Fix any dupes manually before applying.
- **Composite FK guards**: adding `unique (id, piggybank_id)` to bucket/sub
  + composite FKs on transaction is a non-trivial migration. If beta data
  exists at this point, validate all rows pass the new constraints first
  (`select count(*) from transaction t left join bucket b on b.id =
  t.bucket_id and b.piggybank_id = t.piggybank_id where t.bucket_id is
  not null and b.id is null`).
- **Lighthouse perf ≥ 80**: dashboard's 4 sequential Supabase round trips
  (Phase 4 P1) probably blocks this without the `React.cache` fix. Land
  cache wrap before measuring.
