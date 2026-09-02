"use server";

import { revalidatePath } from "next/cache";

import { updateCurrentUserPhone } from "~/lib/queries/user-phone";

export async function updatePhoneAction(formData: FormData): Promise<{ error?: string; success: boolean }> {
  const phone = String(formData.get("phone") ?? "");
  const result = await updateCurrentUserPhone(phone);
  if (result.success) {
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updatePhoneValueAction(phone: string): Promise<{ error?: string; success: boolean }> {
  const result = await updateCurrentUserPhone(phone);
  if (result.success) {
    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard");
  }
  return result;
}
