import "server-only";
import { createId } from "@paralleldrive/cuid2";

import { db } from "~/db";
import { whatsappMessageTable } from "~/db/schema";
import { getProductsByIds } from "~/lib/queries/catalog";
import { getWhatsAppContacts } from "~/lib/queries/contacts";
import {
  getWhatsAppCredentials,
  getWhatsAppTemplateBodies,
  getWhatsAppTemplateNames,
} from "~/lib/queries/integrations";
import { sendWhatsAppTemplate } from "~/lib/whatsapp-cloud-api";
import { buildTemplateParams } from "~/lib/whatsapp-template-vars";

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export interface BroadcastResult {
  failed: number;
  sent: number;
  skipped: number;
  totalContacts: number;
}

/**
 * Broadcasts the current New Arrivals selection via WhatsApp template to all contacts.
 * Uses the `new_arrivals` template (admin editable in /admin/settings).
 * Each contact gets personalized params derived from the template body variables.
 */
export async function broadcastNewArrivals(
  productIds: string[],
): Promise<{ error?: string; result?: BroadcastResult; success: boolean }> {
  if (productIds.length === 0) {
    return { error: "No products selected as New Arrivals.", success: false };
  }

  const [products, contacts, credentials, templateNames, templateBodies] =
    await Promise.all([
      getProductsByIds(productIds),
      getWhatsAppContacts(),
      getWhatsAppCredentials(),
      getWhatsAppTemplateNames(),
      getWhatsAppTemplateBodies(),
    ]);

  if (products.length === 0) {
    return { error: "Selected products not found.", success: false };
  }

  if (contacts.length === 0) {
    return { error: "No contacts with phone numbers found. Ask customers to add phone at sign-up or checkout.", success: false };
  }

  if (!credentials.phoneNumberId || !credentials.accessToken) {
    return { error: "WhatsApp Cloud API not configured. Set credentials in /admin/settings.", success: false };
  }

  const templateName = templateNames.newArrivals;
  const templateBody = (templateBodies as unknown as Record<string, string>).newArrivals;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_SERVER_APP_URL || "https://example.com";
  const productList = products.map((p) => p.name).join(", ").slice(0, 900);
  const link = `${siteUrl.replace(/\/$/, "")}/products?filter=new-arrivals`;

  let sent = 0;
  let failed = 0;

  // Meta rate limit: ~80 msg/sec per number; we batch 20 with small delay
  for (const batch of chunk(contacts, 20)) {
    const results = await Promise.all(
      batch.map(async (contact) => {
        const firstName = contact.name.split(" ")[0] || contact.name;
        const lastName = contact.name.split(" ").slice(1).join(" ") || "";
        const params = buildTemplateParams(templateBody, {
          first_name: firstName,
          last_name: lastName,
          full_name: contact.name,
          product_list: productList,
          link,
          // legacy tokens that may appear in custom body
          order_number: "",
          total: "",
          status: "",
          tracking_url: link,
        });

        const result = await sendWhatsAppTemplate(
          contact.phone,
          templateName,
          params,
          credentials,
        );

        // Log outbound for admin inbox audit, like notifyStaffOfNewOrder does
        try {
          await db.insert(whatsappMessageTable).values({
            body: `[${templateName}] ${params.join(" | ")}`,
            direction: "outbound",
            fromPhone: "system",
            id: createId(),
            inquiryId: null,
            status: result.success ? "matched" : "ignored",
            toPhone: contact.phone,
            waMessageId: result.success ? result.waMessageId : `failed-${createId()}`,
          });
        } catch (e) {
          console.error("Failed to log broadcast message:", e);
        }

        return result.success;
      }),
    );

    for (const ok of results) {
      if (ok) sent += 1;
      else failed += 1;
    }

    // small backoff between batches to stay under Meta throughput
    if (chunk(contacts, 20).length > 1) {
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  return {
    result: {
      failed,
      sent,
      skipped: 0,
      totalContacts: contacts.length,
    },
    success: true,
  };
}
