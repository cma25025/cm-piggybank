import { redirect } from "next/navigation";
import { currentWeekKey } from "@/lib/digest/week";

export default function DigestRoot() {
  redirect(`/digest/${currentWeekKey()}`);
}
