import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { NewProduct } from "~/db/schema";

import { db } from "~/db";
import {
  categoryTable,
  productImageTable,
  productTable,
  subcategoryTable,
} from "~/db/schema";
import { requireAdmin } from "~/lib/admin";
import { slugify } from "~/lib/slugify";

export interface CategoryInput {
  description: string;
  image: string;
  name: string;
}

export type MutationResult<T = undefined> =
  | { data: T; success: true }
  | { error: string; success: false };

export type ProductInput = Omit<NewProduct, "createdAt" | "id" | "updatedAt">;

export async function createCategory(
  input: CategoryInput,
): Promise<MutationResult<{ id: string }>> {
  await requireAdmin();
  try {
    const id = await generateUniqueId(input.name, async (candidate) => {
      const existing = await db.query.categoryTable.findFirst({
        where: eq(categoryTable.id, candidate),
      });
      return !!existing;
    });
    await db.insert(categoryTable).values({
      description: input.description,
      id,
      image: input.image,
      name: input.name,
      slug: id,
    });
    revalidateStorefront();
    return { data: { id }, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not create the category."),
      success: false,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Categories                                 */
/* -------------------------------------------------------------------------- */

export async function createProduct(
  input: ProductInput,
  images: string[] = [],
): Promise<MutationResult<{ id: string }>> {
  await requireAdmin();
  try {
    const id = await generateUniqueId(input.name, async (candidate) => {
      const existing = await db.query.productTable.findFirst({
        where: eq(productTable.id, candidate),
      });
      return !!existing;
    });
    await db.transaction(async (tx) => {
      await tx.insert(productTable).values({ ...input, id });
      if (images.length > 0) {
        await tx.insert(productImageTable).values(
          images.map((url, index) => ({
            id: createId(),
            productId: id,
            sortOrder: index,
            url,
          })),
        );
      }
    });
    revalidateStorefront();
    return { data: { id }, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not create the product."),
      success: false,
    };
  }
}

export async function createSubcategory(
  categoryId: string,
  name: string,
): Promise<MutationResult<{ id: string }>> {
  await requireAdmin();
  try {
    const id = await generateUniqueId(name, async (candidate) => {
      const existing = await db.query.subcategoryTable.findFirst({
        where: eq(subcategoryTable.id, candidate),
      });
      return !!existing;
    });
    await db
      .insert(subcategoryTable)
      .values({ categoryId, id, name, slug: id });
    revalidateStorefront();
    return { data: { id }, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not create the subcategory."),
      success: false,
    };
  }
}

export async function deleteCategory(id: string): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db.delete(categoryTable).where(eq(categoryTable.id, id));
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return {
      error:
        "This category still has products or subcategories under it — remove those first.",
      success: false,
    };
  }
}

export async function deleteProduct(id: string): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db.delete(productTable).where(eq(productTable.id, id));
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { error: "Could not delete the product.", success: false };
  }
}

/* -------------------------------------------------------------------------- */
/*                                Subcategories                               */
/* -------------------------------------------------------------------------- */

export async function deleteSubcategory(id: string): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db.delete(subcategoryTable).where(eq(subcategoryTable.id, id));
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    console.error("Failed to delete subcategory:", error);
    return { error: "Could not delete the subcategory.", success: false };
  }
}

export async function updateCategory(
  id: string,
  input: CategoryInput & { sortOrder?: number },
): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db
      .update(categoryTable)
      .set({
        description: input.description,
        image: input.image,
        name: input.name,
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(categoryTable.id, id));
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not update the category."),
      success: false,
    };
  }
}

export async function updateProduct(
  id: string,
  input: ProductInput,
  images: string[] = [],
): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db.transaction(async (tx) => {
      await tx
        .update(productTable)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(productTable.id, id));
      await tx
        .delete(productImageTable)
        .where(eq(productImageTable.productId, id));
      if (images.length > 0) {
        await tx.insert(productImageTable).values(
          images.map((url, index) => ({
            id: createId(),
            productId: id,
            sortOrder: index,
            url,
          })),
        );
      }
    });
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not update the product."),
      success: false,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Products                                  */
/* -------------------------------------------------------------------------- */

export async function updateSubcategory(
  id: string,
  name: string,
): Promise<MutationResult> {
  await requireAdmin();
  try {
    await db
      .update(subcategoryTable)
      .set({ name, updatedAt: new Date() })
      .where(eq(subcategoryTable.id, id));
    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not update the subcategory."),
      success: false,
    };
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  ) {
    return "That name or reference number is already in use.";
  }
  console.error(fallback, error);
  return fallback;
}

async function generateUniqueId(
  name: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || "item";
  let candidate = base;
  let suffix = 2;
  while (await exists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function revalidateStorefront(): void {
  revalidatePath("/", "layout");
}
