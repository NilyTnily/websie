"use server";

import { revalidatePath } from "next/cache";

import type { Inquiry } from "~/db/schema";

import {
  getInquiryById,
  updateInquiryDelivery,
  updateInquiryStatus,
} from "~/lib/queries/inquiries";
import {
  createShipment,
  deleteShipment,
  type ShipmentInput,
  updateShipment,
} from "~/lib/queries/shipments";
import {
  applyMessageAsShipment,
  markMessageIgnored,
  matchMessageToInquiry,
} from "~/lib/queries/whatsapp-messages";
import { sendAdminReply } from "~/lib/queries/whatsapp-notify";

export interface DeliveryFormState {
  error?: string;
}

export interface ShipmentFormState {
  error?: string;
}

export interface WhatsAppReplyFormState {
  error?: string;
}

export async function applyMessageAsShipmentAction(
  messageId: string,
  inquiryId: string,
  _prevState: ShipmentFormState,
  formData: FormData,
): Promise<ShipmentFormState> {
  const result = await applyMessageAsShipment(
    messageId,
    inquiryId,
    parseShipmentFormData(formData),
  );
  if (!result.success) return { error: result.error };
  revalidateOrder(inquiryId);
  return {};
}

export async function createShipmentAction(
  inquiryId: string,
  _prevState: ShipmentFormState,
  formData: FormData,
): Promise<ShipmentFormState> {
  const result = await createShipment(inquiryId, parseShipmentFormData(formData));
  if (!result.success) return { error: result.error };
  revalidateOrder(inquiryId);
  return {};
}

export async function deleteShipmentAction(
  inquiryId: string,
  shipmentId: string,
): Promise<void> {
  await deleteShipment(shipmentId);
  revalidateOrder(inquiryId);
}

export async function ignoreMessageAction(messageId: string): Promise<void> {
  await markMessageIgnored(messageId);
  revalidatePath("/admin/whatsapp");
}

export async function matchMessageToOrderAction(
  messageId: string,
  inquiryId: string,
): Promise<void> {
  await matchMessageToInquiry(messageId, inquiryId);
  revalidatePath("/admin/whatsapp");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
}

export async function sendWhatsAppReplyAction(
  inquiryId: string,
  toPhone: string,
  _prevState: WhatsAppReplyFormState,
  formData: FormData,
): Promise<WhatsAppReplyFormState> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Message can't be empty." };

  const inquiry = await getInquiryById(inquiryId);
  if (!inquiry) return { error: "Order not found." };

  const result = await sendAdminReply(inquiry, toPhone, body);
  if (!result.success) return { error: result.error };

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  return {};
}

export async function updateInquiryDeliveryAction(
  id: string,
  _prevState: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const deliveryStatus = String(
    formData.get("deliveryStatus") ?? "",
  ) as Inquiry["deliveryStatus"];

  const result = await updateInquiryDelivery(id, { deliveryStatus });
  if (!result.success) return { error: result.error };

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath(`/dashboard/orders/${id}`);
  return {};
}

export async function updateInquiryStatusAction(
  id: string,
  status: Inquiry["status"],
): Promise<void> {
  await updateInquiryStatus(id, status);
  revalidatePath("/admin/inquiries");
}

export async function updateShipmentAction(
  inquiryId: string,
  shipmentId: string,
  _prevState: ShipmentFormState,
  formData: FormData,
): Promise<ShipmentFormState> {
  const result = await updateShipment(shipmentId, parseShipmentFormData(formData));
  if (!result.success) return { error: result.error };
  revalidateOrder(inquiryId);
  return {};
}

function parseShipmentFormData(formData: FormData): ShipmentInput {
  return {
    carrier: String(formData.get("carrier") ?? "").trim(),
    itemIds: formData.getAll("itemIds").map(String),
    label: String(formData.get("label") ?? "").trim(),
    trackingNumber: String(formData.get("trackingNumber") ?? "").trim(),
    trackingUrl: String(formData.get("trackingUrl") ?? "").trim(),
  };
}

function revalidateOrder(inquiryId: string): void {
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath(`/dashboard/orders/${inquiryId}`);
  revalidatePath("/admin/whatsapp");
}
