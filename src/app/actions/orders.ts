"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "~/lib/auth";
import { cancelInquiryForUser } from "~/lib/queries/inquiries";

export type CancelOrderResult =
  | { error: string; success: false }
  | { success: true };

export async function cancelOrderAction(
  orderId: string,
): Promise<CancelOrderResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You need to be signed in to cancel an order.", success: false };
  }
  if (!orderId) {
    return { error: "Missing order id.", success: false };
  }
  const result = await cancelInquiryForUser(orderId, user.id);
  if (!result.success) {
    return result;
  }
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);
  return { success: true };
}
