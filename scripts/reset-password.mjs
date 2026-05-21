#!/usr/bin/env node
/**
 * Admin: reset a caretaker's password via Supabase's admin API.
 *
 * Beats the SQL crypt() workaround because it goes through Supabase's auth
 * service (proper hash + audit + downstream effects like session invalidation).
 *
 * Usage:
 *   node scripts/reset-password.mjs --email <addr> [--password <pwd>]
 *
 *   --email     Required. The caretaker's email.
 *   --password  Optional. If omitted, generates a random temp password and
 *               prints it once. Always rotate after first login.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL from .env.local.
 * The service role key has full admin access — never commit, never share.
 *
 * Why a script and not raw SQL: SQL UPDATE on auth.users.encrypted_password
 * writes a bcrypt hash but skips Supabase's hooks (session revocation, audit
 * trail, identity_data sync). This script delegates to gotrue which does it
 * correctly.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--email") out.email = argv[++i];
    else if (k === "--password") out.password = argv[++i];
    else if (k === "--help" || k === "-h") out.help = true;
    else if (k.startsWith("--")) {
      console.error(`Unknown flag: ${k}`);
      process.exit(2);
    }
  }
  return out;
}

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    console.error(`Could not read ${path}. Run from the repo root.`);
    process.exit(2);
  }
  const env = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

function generatePassword() {
  // Readable, distinctive, easy to copy/paste once.
  const hex = randomBytes(4).toString("hex");
  return `PigTemp-${hex}-Reset!`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.email) {
    console.log(
      "Usage: node scripts/reset-password.mjs --email <addr> [--password <pwd>]\n" +
        "\n" +
        "Resets a caretaker's password via Supabase admin API. If --password is\n" +
        "omitted, a random temp password is generated and printed once.",
    );
    process.exit(args.help ? 0 : 2);
  }

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(2);
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find the user by email.
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) {
    console.error("admin.listUsers failed:", listErr.message);
    process.exit(1);
  }
  const user = list.users.find(
    (u) => u.email?.toLowerCase() === args.email.toLowerCase(),
  );
  if (!user) {
    console.error(`No user found with email ${args.email}`);
    process.exit(1);
  }

  const password = args.password ?? generatePassword();

  // updateUserById is the admin path; bypasses old-password requirement.
  // Setting email_confirm: true is idempotent — confirms if not already.
  const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (updateErr) {
    console.error("admin.updateUserById failed:", updateErr.message);
    process.exit(1);
  }

  // Print the password ONCE. Caller copies + uses + rotates.
  console.log("");
  console.log("  ✓ Password reset for", user.email);
  console.log("");
  console.log("    Temp password:", password);
  console.log("");
  console.log("  Tell the user to log in immediately, then change it via");
  console.log("  /forgot-password (now that email is confirmed, the reset");
  console.log("  email will send).");
  console.log("");
}

main().catch((err) => {
  console.error("Unexpected error:", err.message ?? err);
  process.exit(1);
});
