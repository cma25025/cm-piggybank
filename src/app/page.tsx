import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">CM Piggybank</h1>
      <p className="text-gray-600 mb-8">Track your savings goals</p>
      <Link
        href="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Get Started
      </Link>
    </main>
  );
}
