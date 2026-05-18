# CM Piggybank — Setup Guide

This project is already linked to:
- **GitHub:** `https://github.com/cma25025/cm-piggybank.git`
- **Vercel:** project `cm-piggybank` (id `prj_ivgoHOYF2cSqYazxECU7Th0SBvQ7`)
- **Supabase:** project `supabase-fulvous-arrow` (ref `scuxpypcxwlyyfgovncf`)

For a fresh clone, the steps below get you to a running local app.

## 1. Install dependencies

```bash
npm install
```

Requires Node `>=20 <26`.

## 2. Environment variables

Create `.env.local` with the values from Supabase Dashboard → Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## 3. Apply database migrations

The Supabase CLI must be authenticated:

```bash
# Open a real terminal (not Claude Code bash); browser flow needed
supabase login

# Confirm project is linked
supabase projects list   # the cm-piggybank row should have ● in LINKED

# Apply migrations
supabase db push
```

## 4. Regenerate types after schema changes

```bash
npm run db:types
```

Writes to `src/lib/db/types.ts`. Run after any migration.

## 5. Configure Supabase Auth (one-time manual)

In Supabase Dashboard → **Authentication → Sign In / Up**:

- **Disable "Confirm email"** for the beta cohort (caretakers log in immediately
  after signup; no email click required). Re-enable before public launch.

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` for local dev. Add Vercel preview /
  production URLs as needed.
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and the
  production equivalent.

In Supabase Dashboard → **Authentication → Email Templates**:

- The default "Reset Password" template works. Customize copy for beta warmth
  if you want.

## 6. Run locally

```bash
npm run dev
```

→ http://localhost:3000

- `/signup` — create account
- `/login` — sign in
- `/forgot-password` → `/auth/callback?next=/reset-password` → `/reset-password`
- `/dashboard` — placeholder (real dashboard ships Phase 4)

## 7. Run tests

```bash
npm test            # one-shot
npm run test:watch  # watch mode
npm run test:ui     # web UI
```

Currently covers: `src/lib/distribution.test.ts` (15 cases — distribution math,
rounding edges, input validation).

Live-DB integration tests (RLS / cascade / FK ordering / trigger security /
funder race) are pending — see `docs/polish-todo.md`.

## 8. Deploy

Pushing to GitHub `main` auto-deploys to Vercel (project already linked).
Set the same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` env vars in Vercel project settings.

## Current build state

See `docs/v1-implementation-plan.md` for the full phased build.

- ✅ Phase 0 — Teardown + tooling
- ✅ Phase 1 — Schema + RLS + triggers + RPCs
- ✅ Phase 2 — Auth + password reset
- Phase 3 — Onboarding wizard
- Phase 4 — Dashboard (with slots) + Bucket detail + Activity + Coming-soon
- Phase 5 — Add Money + Log Spend + Void
- Phase 6 — Funders
- Phase 7 — Reconciliation
- Phase 8 — Sunday digest
- Phase 9 — Settings + export + polish
