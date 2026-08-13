"use server";

import { revalidatePath } from "next/cache";

import type { Inquiry } from "~/db/schema";

import {
  updateInquiryDelivery,
  updateInquiryStatus,
} from "~/lib/queries/inquiries";

export interface DeliveryFormState {
  error?: string;
}

export async function updateInquiryDeliveryAction(
  id: string,
  _prevState: DeliveryFormState,
  formData: FormData,
): Promise<DeliveryFormState> {
  const deliveryStatus = String(
    formData.get("deliveryStatus") ?? "",
  ) as Inquiry["deliveryStatus"];
  const carrier = String(formData.get("carrier") ?? "").trim();
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();

  const result = await updateInquiryDelivery(id, {
    carrier,
    deliveryStatus,
    trackingUrl,
  });
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
