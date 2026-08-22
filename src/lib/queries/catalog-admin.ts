import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { count, eq, inArray } from "drizzle-orm";
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
import { notifyPendingSubscribers } from "~/lib/queries/stock-notifications";
import { slugify } from "~/lib/slugify";
import { MAX_TABLE_PRODUCTS } from "~/lib/table-constants";
import { generateTableCutout } from "~/lib/table-cutout";

export interface CategoryInput {
  description: string;
  image: string;
  name: string;
}

export type MutationResult<T = undefined> =
  | { data: T; success: true }
  | { error: string; success: false };

export type ProductInput = Omit<NewProduct, "createdAt" | "id" | "updatedAt">;

export interface ProductMediaInput {
  mediaType: "360" | "image" | "video";
  url: string;
}

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
  media: ProductMediaInput[] = [],
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
      if (media.length > 0) {
        await tx.insert(productImageTable).values(
          media.map((item, index) => ({
            id: createId(),
            mediaType: item.mediaType,
            productId: id,
            sortOrder: index,
            url: item.url,
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

// Flips a product's onTable flag, enforcing the MAX_TABLE_PRODUCTS cap and
// generating its cutout (background-removed PNG, see table-cutout.ts) on
// first enable — the admin only ever picks a product, never runs a separate
// "generate" step. tableCutoutUrl is cached on the product row and reused on
// later toggles, so turning a product on and off again doesn't regenerate it.
export async function setProductOnTable(
  id: string,
  onTable: boolean,
): Promise<MutationResult> {
  await requireAdmin();
  try {
    const product = await db.query.productTable.findFirst({
      columns: { image: true, onTable: true, tableCutoutUrl: true },
      where: eq(productTable.id, id),
    });
    if (!product) {
      return { error: "Product not found.", success: false };
    }

    if (onTable && !product.onTable) {
      const [row] = await db
        .select({ value: count() })
        .from(productTable)
        .where(eq(productTable.onTable, true));
      if ((row?.value ?? 0) >= MAX_TABLE_PRODUCTS) {
        return {
          error: `Only ${MAX_TABLE_PRODUCTS} products can be on the table at once — turn one off first.`,
          success: false,
        };
      }
    }

    let tableCutoutUrl = product.tableCutoutUrl;
    // Auto-generates transparent cutout on first enable; also regenerates if
    // the stored cutout is just the original image (fallback) so every
    // watch on the table is always background-removed without manual steps.
    if (onTable && (!tableCutoutUrl || tableCutoutUrl === product.image)) {
      const cutout = await generateTableCutout(id, product.image);
      if (!cutout.success) {
        return { error: cutout.error, success: false };
      }
      tableCutoutUrl = cutout.data.url;
    }

    await db
      .update(productTable)
      .set({ onTable, tableCutoutUrl, updatedAt: new Date() })
      .where(eq(productTable.id, id));

    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not update the table selection."),
      success: false,
    };
  }
}

// Bulk visibility save for the admin products table's Select All / Deselect
// All + Save flow — one round trip for however many rows changed, rather
// than a request per checkbox.
export async function setProductsVisibility(
  changes: { id: string; visible: boolean }[],
): Promise<MutationResult> {
  await requireAdmin();
  if (changes.length === 0) return { data: undefined, success: true };
  try {
    const toShow = changes.filter((c) => c.visible).map((c) => c.id);
    const toHide = changes.filter((c) => !c.visible).map((c) => c.id);

    await db.transaction(async (tx) => {
      if (toShow.length > 0) {
        await tx
          .update(productTable)
          .set({ updatedAt: new Date(), visible: true })
          .where(inArray(productTable.id, toShow));
      }
      if (toHide.length > 0) {
        await tx
          .update(productTable)
          .set({ updatedAt: new Date(), visible: false })
          .where(inArray(productTable.id, toHide));
      }
    });

    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not update product visibility."),
      success: false,
    };
  }
}

// Persists the admin's drag-and-drop arrangement of the up-to-6 onTable
// products — orderedIds is the full list in its new display order, each
// getting its array index as tableSortOrder (see getTableProducts, which
// reads this back out).
export async function setTableOrder(
  orderedIds: string[],
): Promise<MutationResult> {
  await requireAdmin();
  if (orderedIds.length === 0) return { data: undefined, success: true };
  try {
    await db.transaction(async (tx) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          tx
            .update(productTable)
            .set({ tableSortOrder: index, updatedAt: new Date() })
            .where(eq(productTable.id, id)),
        ),
      );
    });

    revalidateStorefront();
    return { data: undefined, success: true };
  } catch (error) {
    return {
      error: errorMessage(error, "Could not save the table order."),
      success: false,
    };
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
  media: ProductMediaInput[] = [],
): Promise<MutationResult> {
  await requireAdmin();
  try {
    const existing = await db.query.productTable.findFirst({
      columns: { inStock: true },
      where: eq(productTable.id, id),
    });

    await db.transaction(async (tx) => {
      await tx
        .update(productTable)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(productTable.id, id));
      await tx
        .delete(productImageTable)
        .where(eq(productImageTable.productId, id));
      if (media.length > 0) {
        await tx.insert(productImageTable).values(
          media.map((item, index) => ({
            id: createId(),
            mediaType: item.mediaType,
            productId: id,
            sortOrder: index,
            url: item.url,
          })),
        );
      }
    });
    revalidateStorefront();

    if (existing && !existing.inStock && input.inStock) {
      await notifyPendingSubscribers(id);
    }

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
