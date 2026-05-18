import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Default CTA row when Phase 8 hasn't placed its "Print digest" button yet.
 * Phase 5 makes /add-money + /log-spend modals real; for Phase 4 these are
 * link placeholders that route to coming-soon-style stubs.
 */
export function DefaultCtaRow() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/add-money">＋ Add money</Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href="/log-spend">− Log spend</Link>
      </Button>
    </div>
  );
}
