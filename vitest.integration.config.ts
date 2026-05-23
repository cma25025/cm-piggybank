import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Integration test config — runs against the LIVE Supabase project linked
 * in supabase/.temp/linked-project.json. Creates throwaway test caretakers
 * via the admin API and cleans them up in afterAll.
 *
 * Gated on .env.local having SUPABASE_SERVICE_ROLE_KEY. If missing, tests
 * skip via describe.skipIf in each suite.
 *
 * Single-fork pool so concurrent-test logic inside test files is
 * deterministic. We fire concurrent operations EXPLICITLY (e.g. Promise.all
 * of two RPC calls) — Vitest worker parallelism would race the harness
 * setup/teardown instead.
 *
 *   npm run test:integration
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    pool: "forks",
    // Sequential file execution — concurrent ops happen explicitly inside
    // tests (Promise.all of two RPC calls for race/TOCTOU); worker
    // parallelism would race the harness setup/teardown instead.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
