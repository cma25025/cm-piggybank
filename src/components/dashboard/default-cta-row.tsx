import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Dashboard primary actions. Add Money and Log Spend get equal visual
 * weight — both are first-class flows the caretaker reaches for daily.
 * Phase 8 will compose a Print Digest button alongside these.
 */
export function DefaultCtaRow() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button asChild className="h-12 text-base">
        <Link href="/add-money">＋ Add money</Link>
      </Button>
      <Button asChild variant="outline" className="h-12 text-base">
        <Link href="/log-spend">− Log spend</Link>
      </Button>
    </div>
  );
}
