import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

import type { InquiryShipment } from "~/db/schema";

import { db } from "~/db";
import { inquiryShipmentTable, inquiryTable } from "~/db/schema";
import { requireAdmin } from "~/lib/admin";

export interface ShipmentInput {
  carrier?: string;
  itemIds?: string[];
  label?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

type ShipmentResult =
  | { error: string; success: false }
  | { shipment: InquiryShipment; success: true };

export async function createShipment(
  inquiryId: string,
  input: ShipmentInput,
): Promise<ShipmentResult> {
  await requireAdmin();
  try {
    const [shipment] = await db
      .insert(inquiryShipmentTable)
      .values({
        carrier: input.carrier || null,
        id: createId(),
        inquiryId,
        itemIds: input.itemIds?.length ? input.itemIds : null,
        label: input.label || null,
        trackingNumber: input.trackingNumber || null,
        trackingUrl: input.trackingUrl || null,
      })
      .returning();
    if (!shipment) {
      return { error: "Failed to create shipment.", success: false };
    }

    // Keep the legacy single-shipment fields on the inquiry in sync for any
    // reader that hasn't moved to the shipments list yet (customer emails,
    // older dashboard views).
    const existing = await db.query.inquiryShipmentTable.findMany({
      where: eq(inquiryShipmentTable.inquiryId, inquiryId),
    });
    if (existing.length === 1) {
      await db
        .update(inquiryTable)
        .set({
          carrier: shipment.carrier,
          trackingUrl: shipment.trackingUrl,
          updatedAt: new Date(),
        })
        .where(eq(inquiryTable.id, inquiryId));
    }

    return { shipment, success: true };
  } catch (error) {
    console.error("Failed to create shipment:", error);
    return { error: "Failed to create shipment.", success: false };
  }
}

export async function deleteShipment(
  shipmentId: string,
): Promise<{ error: string; success: false } | { success: true }> {
  await requireAdmin();
  try {
    await db
      .delete(inquiryShipmentTable)
      .where(eq(inquiryShipmentTable.id, shipmentId));
    return { success: true };
  } catch (error) {
    console.error("Failed to delete shipment:", error);
    return { error: "Failed to delete shipment.", success: false };
  }
}

export async function getShipmentsForInquiry(
  inquiryId: string,
): Promise<InquiryShipment[]> {
  try {
    await requireAdmin();
    return await db.query.inquiryShipmentTable.findMany({
      orderBy: (shipments, { asc }) => [asc(shipments.createdAt)],
      where: eq(inquiryShipmentTable.inquiryId, inquiryId),
    });
  } catch (error) {
    console.error("Failed to fetch shipments:", error);
    return [];
  }
}

export async function updateShipment(
  shipmentId: string,
  input: ShipmentInput,
): Promise<ShipmentResult> {
  await requireAdmin();
  try {
    const [shipment] = await db
      .update(inquiryShipmentTable)
      .set({
        carrier: input.carrier || null,
        itemIds: input.itemIds?.length ? input.itemIds : null,
        label: input.label || null,
        trackingNumber: input.trackingNumber || null,
        trackingUrl: input.trackingUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(inquiryShipmentTable.id, shipmentId))
      .returning();
    if (!shipment) {
      return { error: "Shipment not found.", success: false };
    }
    return { shipment, success: true };
  } catch (error) {
    console.error("Failed to update shipment:", error);
    return { error: "Failed to update shipment.", success: false };
  }
}
