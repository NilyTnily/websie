import { redirect } from "next/navigation";

// Folded into the Vault's Details tab — this page's fields (profile
// info, notifications, password) had no working Save handlers.
export default function SettingsPage() {
  redirect("/dashboard/profile");
}
