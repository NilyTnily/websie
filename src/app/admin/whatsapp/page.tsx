import type { WhatsappMessage } from "~/db/schema";

import { getInquiries } from "~/lib/queries/inquiries";
import { getWhatsAppMessages } from "~/lib/queries/whatsapp-messages";

import { WhatsAppInboxClient } from "./page.client";

interface AdminWhatsAppPageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_FILTERS: WhatsappMessage["status"][] = [
  "received",
  "matched",
  "applied",
  "ignored",
];

export default async function AdminWhatsAppPage({
  searchParams,
}: AdminWhatsAppPageProps) {
  const { status } = await searchParams;
  const statusFilter = STATUS_FILTERS.find((s) => s === status);

  const [messages, inquiries] = await Promise.all([
    getWhatsAppMessages(statusFilter ? { status: statusFilter } : {}),
    getInquiries(),
  ]);

  return (
    <WhatsAppInboxClient
      inquiries={inquiries}
      messages={messages}
      statusFilter={statusFilter}
    />
  );
}
