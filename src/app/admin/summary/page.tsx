import {
  getAwaitingDispatchCount,
  getDashboardStats,
  getInquiriesAging,
  getNeedsYouFirstQueue,
  getRevenueDelta,
} from "~/lib/queries/dashboard";
import { getUsersWithUploads } from "~/lib/queries/uploads";

import AdminPageClient from "./page.client";
import { StoreDashboard } from "./store-dashboard";

export default async function AdminPage() {
  const [
    stats,
    usersWithUploads,
    revenueDelta,
    inquiriesAging,
    awaitingDispatch,
    needsYouFirst,
  ] = await Promise.all([
    getDashboardStats(),
    getUsersWithUploads(),
    getRevenueDelta(),
    getInquiriesAging(),
    getAwaitingDispatchCount(),
    getNeedsYouFirstQueue(),
  ]);

  return (
    <div className="space-y-10">
      <StoreDashboard
        awaitingDispatch={awaitingDispatch}
        inquiriesAging={inquiriesAging}
        needsYouFirst={needsYouFirst}
        revenueDelta={revenueDelta}
        stats={stats}
      />

      <div className="space-y-6 border-t pt-6">
        <h2 className="text-xl font-semibold">Users &amp; Uploads</h2>
        <AdminPageClient initialData={usersWithUploads} />
      </div>
    </div>
  );
}
