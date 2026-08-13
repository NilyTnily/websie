"use server";

import { redirect } from "next/navigation";

import {
  createTestimonial,
  deleteTestimonial,
  updateTestimonial,
} from "~/lib/queries/testimonials";

export interface TestimonialFormState {
  error?: string;
}

export async function createTestimonialAction(
  _prevState: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  const built = buildTestimonialInput(formData);
  if ("error" in built) return { error: built.error };

  const result = await createTestimonial(built.input);
  if (!result.success) return { error: result.error };
  redirect("/admin/testimonials");
}

export async function updateTestimonialAction(
  id: string,
  _prevState: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  const built = buildTestimonialInput(formData);
  if ("error" in built) return { error: built.error };

  const result = await updateTestimonial(id, built.input);
  if (!result.success) return { error: result.error };
  redirect("/admin/testimonials");
}

export async function deleteTestimonialAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deleteTestimonial(id);
}

function buildTestimonialInput(formData: FormData) {
  const customerName = textField(formData, "customerName");
  const customerHandle = textField(formData, "customerHandle");
  const quote = textField(formData, "quote");
  const avatarUrl = textField(formData, "avatarUrl") || null;
  const sortOrderRaw = textField(formData, "sortOrder");
  const sortOrder = sortOrderRaw ? Number.parseInt(sortOrderRaw, 10) : 0;

  if (!customerName || !customerHandle || !quote) {
    return {
      error: "Customer name, handle, and quote are required.",
    } as const;
  }

  return {
    input: {
      avatarUrl,
      customerHandle,
      customerName,
      quote,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  } as const;
}

function textField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
