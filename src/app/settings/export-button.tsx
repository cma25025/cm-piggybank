"use client";

import { Button } from "@/components/ui/button";

export function ExportButton({ size = "default" }: { size?: "sm" | "default" }) {
  return (
    <Button asChild size={size} variant="outline">
      <a href="/api/export" download>
        ⬇ Export my data (JSON)
      </a>
    </Button>
  );
}
