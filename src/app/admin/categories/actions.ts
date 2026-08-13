"use server";

import { redirect } from "next/navigation";

import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  updateCategory,
  updateSubcategory,
} from "~/lib/queries/catalog-admin";

export interface CategoryFormState {
  error?: string;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const name = requiredField(formData, "name");
  const description = requiredField(formData, "description");
  const image = requiredField(formData, "image");
  if (!name || !description || !image) {
    return { error: "Name, description, and image are all required." };
  }

  const result = await createCategory({ description, image, name });
  if (!result.success) return { error: result.error };
  redirect("/admin/categories");
}

export async function createSubcategoryAction(
  formData: FormData,
): Promise<void> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!categoryId || !name) return;
  await createSubcategory(categoryId, name);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deleteCategory(id);
}

export async function deleteSubcategoryAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deleteSubcategory(id);
}

export async function updateCategoryAction(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const name = requiredField(formData, "name");
  const description = requiredField(formData, "description");
  const image = requiredField(formData, "image");
  if (!name || !description || !image) {
    return { error: "Name, description, and image are all required." };
  }

  const result = await updateCategory(id, { description, image, name });
  if (!result.success) return { error: result.error };
  redirect("/admin/categories");
}

export async function updateSubcategoryAction(
  formData: FormData,
): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  await updateSubcategory(id, name);
}

function requiredField(formData: FormData, key: string): null | string {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}
