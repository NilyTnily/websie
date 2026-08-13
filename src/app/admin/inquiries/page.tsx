import { getInquiries, getInquiryStats } from "~/lib/queries/inquiries";

import { InquiriesPageClient } from "./page.client";

export default async function AdminInquiriesPage() {
  const [stats, inquiries] = await Promise.all([
    getInquiryStats(),
    getInquiries(),
  ]);

  return <InquiriesPageClient inquiries={inquiries} stats={stats} />;
}
