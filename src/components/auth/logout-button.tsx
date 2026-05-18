"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/logout/actions";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmit />
    </form>
  );
}
