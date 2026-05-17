import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import CreatePiggybankForm from "@/components/CreatePiggybankForm";
import PiggybankCard from "@/components/PiggybankCard";

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
      <p className="text-gray-600 mb-6">Welcome, {user.email}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {piggybanks?.map((bank) => (
          <PiggybankCard key={bank.id} bank={bank} />
        ))}
        <CreatePiggybankForm />
      </div>
    </main>
  );
}
