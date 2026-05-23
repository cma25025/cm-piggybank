import { describe, it, expect } from "vitest";
import { aggregateTopFunders, type RawTopFunderRow } from "./aggregate";

function row(
  funderId: string,
  amountCents: number,
  displayName: string | null,
): RawTopFunderRow {
  return {
    funder_id: funderId,
    amount_cents: amountCents,
    funder: displayName === null ? null : { display_name: displayName },
  };
}

describe("aggregateTopFunders", () => {
  it("collapses multiple deposits per funder and sorts desc", () => {
    const rows: RawTopFunderRow[] = [
      row("A", 1000, "Mom"),
      row("B", 500, "Grandma"),
      row("A", 2500, "Mom"),
      row("C", 750, "Aunt"),
    ];
    expect(aggregateTopFunders(rows)).toEqual([
      { funderId: "A", displayName: "Mom", totalCents: 3500 },
      { funderId: "C", displayName: "Aunt", totalCents: 750 },
      { funderId: "B", displayName: "Grandma", totalCents: 500 },
    ]);
  });

  it("respects the limit param", () => {
    const rows: RawTopFunderRow[] = [
      row("A", 100, "A"),
      row("B", 200, "B"),
      row("C", 300, "C"),
      row("D", 400, "D"),
      row("E", 500, "E"),
    ];
    const top = aggregateTopFunders(rows, 3);
    expect(top).toHaveLength(3);
    expect(top.map((t) => t.funderId)).toEqual(["E", "D", "C"]);
  });

  it("returns empty array when no rows", () => {
    expect(aggregateTopFunders([])).toEqual([]);
  });

  it("skips rows with null funder_id", () => {
    const rows: RawTopFunderRow[] = [
      { funder_id: null, amount_cents: 1000, funder: null },
      row("A", 500, "Mom"),
    ];
    expect(aggregateTopFunders(rows)).toEqual([
      { funderId: "A", displayName: "Mom", totalCents: 500 },
    ]);
  });

  it("handles supabase array-shaped FK embed", () => {
    const rows: RawTopFunderRow[] = [
      { funder_id: "A", amount_cents: 1000, funder: [{ display_name: "Mom" }] },
    ];
    expect(aggregateTopFunders(rows)).toEqual([
      { funderId: "A", displayName: "Mom", totalCents: 1000 },
    ]);
  });

  it("falls back to 'Someone' when display_name missing", () => {
    const rows: RawTopFunderRow[] = [row("A", 1000, null)];
    expect(aggregateTopFunders(rows)).toEqual([
      { funderId: "A", displayName: "Someone", totalCents: 1000 },
    ]);
  });

  it("treats null amount_cents as zero (defensive)", () => {
    const rows: RawTopFunderRow[] = [
      { funder_id: "A", amount_cents: null, funder: { display_name: "Mom" } },
      row("A", 1000, "Mom"),
    ];
    expect(aggregateTopFunders(rows)).toEqual([
      { funderId: "A", displayName: "Mom", totalCents: 1000 },
    ]);
  });
});
