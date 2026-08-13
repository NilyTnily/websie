import { getDashboardStats } from "~/lib/queries/dashboard";
import { getUsersWithUploads } from "~/lib/queries/uploads";

import AdminPageClient from "./page.client";
import { StoreDashboard } from "./store-dashboard";

export default async function AdminPage() {
  const [stats, usersWithUploads] = await Promise.all([
    getDashboardStats(),
    getUsersWithUploads(),
  ]);

  return (
    <div className="space-y-10">
      <StoreDashboard stats={stats} />

      <div className="space-y-6 border-t pt-6">
        <h2 className="text-xl font-semibold">Users &amp; Uploads</h2>
        <AdminPageClient initialData={usersWithUploads} />
      </div>
    </div>
  );
}
