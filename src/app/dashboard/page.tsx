import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's piggybanks
  const { data: piggybanks } = await supabase
    .from("piggybanks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Piggybanks</h1>
        <SignOutButton />
      </div>
      <p className="text-gray-600 mb-4">Welcome, {user.email}</p>

      {piggybanks && piggybanks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {piggybanks.map((bank) => (
            <div key={bank.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="font-semibold text-lg">{bank.name}</h2>
              <p className="text-gray-500 text-sm">{bank.description}</p>
              <div className="mt-2">
                <span className="text-2xl font-bold text-green-600">
                  ${(bank.current_amount / 100).toFixed(2)}
                </span>
                <span className="text-gray-400">
                  {" "}/ ${(bank.goal_amount / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          No piggybanks yet. Create your first savings goal!
        </p>
      )}
    </main>
  );
}
