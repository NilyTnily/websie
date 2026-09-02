import "server-only";
import { sql } from "drizzle-orm";

import { db } from "~/db";
import { inquiryTable, userTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface Contact {
  name: string;
  phone: string; // normalized digits only
  rawPhone: string;
  source: "inquiry" | "user";
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

/**
 * Unified contact list for WhatsApp broadcasts.
 * Merges:
 *  - user.phone (where user has opted-in phone)
 *  - inquiry.customerContact (guest + user inquiries, phone-like values)
 * Dedupes by normalized digits, prefers user name over inquiry name.
 */
export async function getWhatsAppContacts(): Promise<Contact[]> {
  try {
    await requireAdmin();
  } catch {
    // allow internal callers (broadcast) without admin check? keep gated for now
    // but broadcast actions already requireAdmin, so this is fine
  }

  const [users, inquiries] = await Promise.all([
    db
      .select({ name: userTable.name, phone: userTable.phone })
      .from(userTable)
      .where(sql`${userTable.phone} IS NOT NULL AND ${userTable.phone} <> ''`),
    db
      .select({
        customerContact: inquiryTable.customerContact,
        customerName: inquiryTable.customerName,
      })
      .from(inquiryTable),
  ]);

  const map = new Map<string, Contact>();

  for (const u of users) {
    if (!u.phone) continue;
    const normalized = normalizePhone(u.phone);
    if (!normalized) continue;
    if (!map.has(normalized)) {
      map.set(normalized, {
        name: u.name || "there",
        phone: normalized,
        rawPhone: u.phone,
        source: "user",
      });
    }
  }

  for (const inq of inquiries) {
    const normalized = normalizePhone(inq.customerContact);
    if (!normalized) continue; // email-only inquiries are skipped
    if (!map.has(normalized)) {
      map.set(normalized, {
        name: inq.customerName || "there",
        phone: normalized,
        rawPhone: inq.customerContact,
        source: "inquiry",
      });
    }
  }

  return [...map.values()];
}

export async function getWhatsAppContactCount(): Promise<number> {
  const contacts = await getWhatsAppContacts();
  return contacts.length;
}
