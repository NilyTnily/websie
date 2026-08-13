import "server-only";
import { asc, eq } from "drizzle-orm";

import type { CategoryWithCount, ProductWithRelations } from "~/db/schema";

import { db } from "~/db";
import { categoryTable, productTable, subcategoryTable } from "~/db/schema";

export async function getAllProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      orderBy: [asc(productTable.createdAt)],
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getAllSubcategories() {
  try {
    return await db.query.subcategoryTable.findMany({
      orderBy: [asc(subcategoryTable.sortOrder)],
    });
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return [];
  }
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const categories = await db.query.categoryTable.findMany({
      orderBy: [asc(categoryTable.sortOrder)],
      with: { products: { columns: { id: true } } },
    });
    return categories.map(({ products, ...category }) => ({
      ...category,
      productCount: products.length,
    }));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function getCategoryById(id: string) {
  try {
    return (
      (await db.query.categoryTable.findFirst({
        where: eq(categoryTable.id, id),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return null;
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return (
      (await db.query.categoryTable.findFirst({
        where: eq(categoryTable.slug, slug),
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return null;
  }
}

export async function getFeaturedProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      orderBy: [asc(productTable.createdAt)],
      where: eq(productTable.featured, true),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export async function getProductById(
  id: string,
): Promise<null | ProductWithRelations> {
  try {
    return (
      (await db.query.productTable.findFirst({
        where: eq(productTable.id, id),
        with: {
          category: true,
          images: {
            orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
          },
          subcategory: true,
        },
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export async function getProductsByCategorySlug(slug: string): Promise<null | {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;
  products: ProductWithRelations[];
  subcategories: Awaited<ReturnType<typeof getSubcategories>>;
}> {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  try {
    const [products, subcategories] = await Promise.all([
      db.query.productTable.findMany({
        orderBy: [asc(productTable.createdAt)],
        where: eq(productTable.categoryId, category.id),
        with: {
          category: true,
          images: {
            orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
          },
          subcategory: true,
        },
      }),
      getSubcategories(category.id),
    ]);
    return { category, products, subcategories };
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return { category, products: [], subcategories: [] };
  }
}

export async function getSubcategories(categoryId: string) {
  try {
    return await db.query.subcategoryTable.findMany({
      orderBy: [asc(subcategoryTable.sortOrder)],
      where: eq(subcategoryTable.categoryId, categoryId),
    });
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return [];
  }
}
