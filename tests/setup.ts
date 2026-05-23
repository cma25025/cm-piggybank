/**
 * Vitest setup for integration tests. Loads .env.local into process.env so
 * the test caretaker helpers can find Supabase URL + anon + service role.
 *
 * Same parsing pattern as scripts/reset-password.mjs — keeps dep-free.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

try {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) {
      process.env[m[1]] = v;
    }
  }
} catch {
  console.warn(
    `Could not read ${envPath}. Integration tests requiring service role will skip.`,
  );
}
