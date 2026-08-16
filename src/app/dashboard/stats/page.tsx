import { redirect } from "next/navigation";

// Folded into the Vault's Details tab — this route was a duplicate of the
// same account info shown there.
export default function DashboardStatsPage() {
  redirect("/dashboard/profile");
}
