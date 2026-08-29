import { getInquiries, getInquiryStats } from "~/lib/queries/inquiries";

import { InquiriesPageClient } from "./page.client";

const INQUIRY_STATUSES = ["pending", "approved", "rejected"] as const;

// Matches the "awaiting dispatch" definition on the dashboard: approved and
// moving through fulfilment but not yet shipped.
const AWAITING_DISPATCH_STATUSES = ["placed", "confirmed", "processing"];

interface AdminInquiriesPageProps {
  searchParams: Promise<{
    delivery?: string;
    sort?: string;
    status?: string;
  }>;
}

export default async function AdminInquiriesPage({
  searchParams,
}: AdminInquiriesPageProps) {
  const { delivery, sort, status } = await searchParams;
  const [stats, inquiries] = await Promise.all([
    getInquiryStats(),
    getInquiries(),
  ]);

  const statusFilter = INQUIRY_STATUSES.find((s) => s === status);
  const awaitingDispatch = delivery === "awaiting";
  const sortOldest = sort === "oldest";

  let filtered = [...inquiries];
  if (awaitingDispatch) {
    filtered = filtered.filter(
      (inquiry) =>
        inquiry.status === "approved" &&
        AWAITING_DISPATCH_STATUSES.includes(inquiry.deliveryStatus),
    );
  }
  if (statusFilter) {
    filtered = filtered.filter((inquiry) => inquiry.status === statusFilter);
  }
  if (sortOldest) {
    filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const labelParts: string[] = [];
  if (awaitingDispatch) labelParts.push("awaiting dispatch");
  else if (statusFilter) labelParts.push(`status: ${statusFilter}`);
  if (sortOldest && !awaitingDispatch) labelParts.push("oldest first");

  return (
    <InquiriesPageClient
      activeFilter={
        labelParts.length > 0
          ? { clearHref: "/admin/inquiries", label: labelParts.join(" · ") }
          : null
      }
      inquiries={filtered}
      stats={stats}
    />
  );
}
