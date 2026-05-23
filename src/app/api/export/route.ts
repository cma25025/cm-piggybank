import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

/**
 * JSON export of the caretaker's full piggybank state. Auth-gated; RLS
 * scopes to the caretaker's own data. Includes everything needed to
 * reconstruct or migrate elsewhere.
 *
 *   GET /api/export → application/json with Content-Disposition: attachment
 *
 * Contains: piggybank, kid_profile, distribution_rule, buckets, subcategories,
 * funders, transactions, requests.
 *
 * Excludes auth.users data (Supabase-managed, not the caretaker's to export).
 */
export async function GET() {
  await requireUser();
  const supabase = await createClient();

  const { data: piggybank } = await supabase
    .from("piggybank")
    .select("*")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!piggybank) {
    return NextResponse.json({ error: "No active piggybank" }, { status: 404 });
  }

  const piggybankId = piggybank.id;

  const [
    { data: kidProfile },
    { data: distributionRule },
    { data: buckets },
    { data: subcategories },
    { data: funders },
    { data: transactions },
    { data: requests },
  ] = await Promise.all([
    supabase.from("kid_profile").select("*").eq("id", piggybank.kid_profile_id).maybeSingle(),
    supabase.from("distribution_rule").select("*").eq("piggybank_id", piggybankId).maybeSingle(),
    supabase.from("bucket").select("*").eq("piggybank_id", piggybankId),
    supabase.from("subcategory").select("*").eq("piggybank_id", piggybankId),
    supabase.from("funder").select("*").eq("piggybank_id", piggybankId),
    supabase
      .from("transaction")
      .select("*")
      .eq("piggybank_id", piggybankId)
      .order("occurred_at", { ascending: true }),
    supabase.from("request").select("*").eq("piggybank_id", piggybankId),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    export_version: 1,
    exported_at: new Date().toISOString(),
    piggybank,
    kid_profile: kidProfile,
    distribution_rule: distributionRule,
    buckets: buckets ?? [],
    subcategories: subcategories ?? [],
    funders: funders ?? [],
    transactions: transactions ?? [],
    requests: requests ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="piggybank-export-${today}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
