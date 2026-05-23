# Mobile Claude Code — Setup + Verification

What works, how to verify, what to paste into a fresh mobile session.

---

## What's wired

| Surface | How | What mobile can do |
|---|---|---|
| **GitHub** | claude.ai GitHub App installed on `cma25025/cm-piggybank` | Clone, branch, commit, push, open PRs, read issues, read deploy hooks via `gh` CLI |
| **Vercel** | Auto-deploy via GitHub webhook on push to `main` | Pushing to main triggers a production deploy. No first-class Vercel access — read status via `gh api repos/.../deployments`. To go further (deploy logs, env vars), add `VERCEL_TOKEN` to mobile session secrets and use `vercel` CLI or REST API |
| **Supabase** | claude.ai → Settings → Connectors → Supabase (OAuth) | Full Management API via MCP: SQL execution, migrations, types, edge functions, logs, advisors, branches, projects, orgs |

The Supabase Connector tools are namespaced as
`mcp__<random-uuid>__<action>` rather than `mcp__supabase__*` — don't be
confused by the UUID prefix. Look for tool names like
`list_projects`, `execute_sql`, `apply_migration`.

---

## First prompt for a fresh mobile session

Paste verbatim:

```
Read these files first, in order:
1. docs/NEXT-SESSION.md (handoff state, recent commits, what shipped)
2. docs/DISCOVERY-ROADMAP.md (post-v1 product priorities)
3. docs/polish-todo.md (open audit findings)

Conventions (don't fight these):
- User CLAUDE.md says "no framework performance" — skip gstack ceremony,
  surface findings as decisions
- Audit-subagent pattern: after each non-trivial commit, dispatch a
  general-purpose subagent to audit; append findings to docs/polish-todo.md
- React 18 → useFormState from react-dom (NOT useActionState from React 19)
- Money: integer cents per-row, bigint on balance counters
- Schema source of truth is supabase/migrations/*.sql; regen TS types via
  the Supabase MCP's generate_typescript_types
- Drizzle was rejected in eng review; use @supabase/ssr + supabase-js
- Spend UX revamp (Phase a5bc04e): sub is OPTIONAL goal label, NOT a
  budget partition. log_spend gates on bucket.balance, not sub.balance
- Every domain table carries denormalized caretaker_user_id; auto-
  propagated by the SECURITY DEFINER trigger
- soft_delete_piggybank is SECURITY DEFINER because Postgres rejects
  UPDATEs that would produce SELECT-policy-invisible rows

Tell me:
- What you read
- What you'd build first based on the roadmap (Wait-a-Week is the
  recommended next feature per posture B)
- Any P0s open in polish-todo
```

---

## Verifying the Supabase Connector on a new mobile session

If you're unsure the Connector carried through, paste this:

```
Run, in order:
1. List MCP tool names containing "supabase", "execute_sql", or
   "list_projects". Show the names.
2. Call list_projects. Confirm "supabase-fulvous-arrow" appears with
   ref scuxpypcxwlyyfgovncf.
3. Run execute_sql against that project:
   SELECT count(*) AS users FROM auth.users
4. Report results.
```

Healthy: ~29 supabase-namespaced tools, project visible, user count ≥ 1.

---

## Supabase MCP tools — what each is for

29 tools available. Key ones:

**Data + schema**
- `execute_sql` — arbitrary read + write SQL against the project
- `list_tables` — schema introspection
- `list_extensions` — installed pg extensions
- `apply_migration` — push a SQL migration (equivalent of `supabase db push`)
- `list_migrations` — what's been applied
- `generate_typescript_types` — for `src/lib/db/types.ts`

**Project + org**
- `list_projects` / `get_project` / `get_project_url`
- `list_organizations` / `get_organization`
- `get_publishable_keys` — anon + service role
- `pause_project` / `restore_project` — destructive, be careful

**Branches** (Supabase preview environments)
- `list_branches` / `create_branch` / `merge_branch` / `rebase_branch` /
  `reset_branch` / `delete_branch`

**Edge functions**
- `list_edge_functions` / `get_edge_function` / `deploy_edge_function`

**Diagnostics**
- `get_logs` — fetch logs (auth, postgres, api, edge)
- `get_advisors` — security + perf advice from Supabase
- `search_docs` — Supabase docs search

**Cost gates**
- `get_cost` / `confirm_cost` — used before any operation that incurs cost
  (creating projects, branches). Mobile MUST call `confirm_cost` first.

---

## Common mobile workflows

### Apply a migration

```
Write the SQL to supabase/migrations/<timestamp>_<name>.sql first, then
call apply_migration against project scuxpypcxwlyyfgovncf with the same
SQL contents. Verify with list_migrations after.
```

### Regenerate types after a schema change

```
Call generate_typescript_types for project scuxpypcxwlyyfgovncf and write
the output to src/lib/db/types.ts. Commit alongside the migration.
```

### Run integration tests

The mobile session can read .env.local secrets if you've added the keys
to mobile project secrets. Same env vars as `docs/NEXT-SESSION.md`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Then: `npm run test:integration`. Should be 8/8 passing as of `dc11b48`.

### Check live deploy state

```
Use gh CLI: gh api repos/cma25025/cm-piggybank/deployments?environment=Production&per_page=1
The first result is the latest production deploy. Its statuses_url
returns build success/failure + the deploy URL.
```

### Clean up test orphans (after integration runs)

If `npm run test:integration` failed mid-flight, test caretakers may
linger. Sweep:

```sql
DELETE FROM auth.users WHERE email LIKE '%@piggybank-test.example';
```

Cascades to all their piggybanks/kids/transactions via the FK chain.

---

## What's NOT wired automatically

- **Vercel first-class access.** Mobile can trigger deploys via git push.
  To read deploy logs, manage env vars, or call the Vercel REST API
  directly, generate a `VERCEL_TOKEN` at https://vercel.com/account/tokens
  and add to mobile session secrets.
- **Sentry / observability.** None set up. Add Resend / Sentry connectors
  when shipping to public (already noted in NEXT-SESSION.md).
- **Local `supabase` CLI binary.** Mobile sessions run in a sandbox that
  doesn't have the CLI installed. The MCP tools replace every CLI command
  you'd use (apply_migration replaces db push, generate_typescript_types
  replaces gen types, execute_sql replaces db query, etc).

---

## Gotchas

1. **Supabase Connector is claude.ai-scoped, not Claude Code desktop-scoped.**
   Tools that work on mobile do NOT automatically work in `claude` CLI
   on your laptop. Desktop sessions need separate `~/.supabase/access-token`
   from `supabase login --token`.

2. **`auth.audit_log_entries` is empty by default** on free tier. If you
   want forensic trail of login attempts, enable in Supabase Dashboard →
   Settings → Auth → Logs. (Documented in NEXT-SESSION.md too.)

3. **`apply_migration` doesn't create a file** — it just runs the SQL.
   Always write the migration file to `supabase/migrations/` FIRST, then
   call `apply_migration` with the same SQL. The local migration file is
   how `supabase db push` will replay it for fresh environments.

4. **Mobile sessions get a fresh sandbox each run.** No persisted local
   state. The Connector tokens persist across sessions (claude.ai
   scope), but `.env.local` and other local files reset per repo clone.

5. **Cost-incurring operations require confirm_cost.** Creating a new
   project / branch will fail unless you call `get_cost` then
   `confirm_cost` first. Don't loop forever asking the MCP to retry.

---

## Recommended next mobile session

Per `docs/DISCOVERY-ROADMAP.md` posture B: build **Wait-a-Week**. The
single most distinctive behavioral feature missing from v1. Should ship
in ~1 day CC.

Spec in `DISCOVERY-ROADMAP.md` section "v1.1 (immediately after public
launch)" → row 1.1a.

Pattern: add a `wait_list` table (or schema-only `pending_spend_request`
extension), gate Spend withdrawals over a family threshold, add the
countdown UI to the dashboard, ship the kid-confirms-after-7-days flow.
