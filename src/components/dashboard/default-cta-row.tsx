import { Button } from "@/components/ui/button";
import Link from "next/link";
import { currentWeekKey } from "@/lib/digest/week";

/**
 * Dashboard primary actions. Add Money + Log Spend are the daily caretaker
 * actions; the digest link surfaces the Sunday ritual (Phase 8). Stacks on
 * narrow screens, side-by-side from sm: up.
 */
export function DefaultCtaRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Button asChild className="h-12 text-base">
        <Link href="/add-money">＋ Add money</Link>
      </Button>
      <Button asChild variant="outline" className="h-12 text-base">
        <Link href="/log-spend">− Log spend</Link>
      </Button>
      <Button asChild variant="ghost" className="h-12 text-base">
        <Link href={`/digest/${currentWeekKey()}`}>🖨 This week's digest</Link>
      </Button>
    </div>
  );
}
