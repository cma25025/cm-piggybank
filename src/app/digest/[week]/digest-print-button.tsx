"use client";

import { Button } from "@/components/ui/button";

export function DigestPrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => window.print()}
    >
      🖨 Print
    </Button>
  );
}
