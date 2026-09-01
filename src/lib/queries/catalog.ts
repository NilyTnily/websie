import "server-only";
import { and, asc, count, eq, inArray, ne } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import type {
  CategoryWithCount,
  Model,
  ProductWithRelations,
  Subcategory,
} from "~/db/schema";

import { db } from "~/db";
import { categoryTable, productTable, subcategoryTable, watchModelTable } from "~/db/schema";
import { MAX_TABLE_PRODUCTS } from "~/lib/table-constants";

async function fetchAllProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      orderBy: [asc(productTable.createdAt)],
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}
// Deliberately NOT wrapped in unstable_cache — the full catalog with every
// product's images/category/model/subcategory relations serializes well
// past Next's 2MB per-item data-cache limit (13MB+ observed), which made
// every single call throw "Failed to set Next.js data cache" instead of
// ever returning data. React's cache() below still dedupes repeat calls
// within one request; it just doesn't persist/serialize across requests,
// so it has no size ceiling. Only used by admin (wants fresh data anyway)
// and sitemap.ts (see getAllProductsLite for that — same size problem,
// smaller shape).
export const getAllProducts = cache(fetchAllProducts);

async function fetchAllProductsLite(): Promise<
  { id: string; updatedAt: Date }[]
> {
  try {
    return await db.query.productTable.findMany({
      columns: { id: true, updatedAt: true },
    });
  } catch (error) {
    console.error("Failed to fetch product ids:", error);
    return [];
  }
}
const cachedAllProductsLite = unstable_cache(fetchAllProductsLite, ["all-products-lite"], { revalidate: 60, tags: ["products"] });
export const getAllProductsLite = cache(async () => cachedAllProductsLite());

async function fetchAllSubcategories() {
  try {
    return await db.query.subcategoryTable.findMany({
      orderBy: [asc(subcategoryTable.sortOrder)],
    });
  } catch (error) {
    console.error("Failed to fetch subcategories:", error);
    return [];
  }
}
const cachedAllSubcategories = unstable_cache(fetchAllSubcategories, ["all-subcategories"], { revalidate: 60, tags: ["products"] });
export const getAllSubcategories = cache(async () => cachedAllSubcategories());

async function fetchAllModels() {
  try {
    return await db.query.watchModelTable.findMany({
      orderBy: [asc(watchModelTable.sortOrder)],
    });
  } catch (error) {
    console.error("Failed to fetch models:", error);
    return [];
  }
}
const cachedAllModels = unstable_cache(fetchAllModels, ["all-models"], { revalidate: 60, tags: ["products"] });
export const getAllModels = cache(async (): Promise<Model[]> => cachedAllModels());


async function fetchCategoriesWithCounts(): Promise<CategoryWithCount[]> {
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
const cachedCategoriesWithCounts = unstable_cache(fetchCategoriesWithCounts, ["categories-with-counts"], { revalidate: 60, tags: ["products", "categories"] });
export const getCategoriesWithCounts = cache(async (): Promise<CategoryWithCount[]> => cachedCategoriesWithCounts());

async function fetchCategoryById(id: string) {
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
const cachedCategoryById = unstable_cache(fetchCategoryById, ["category-by-id"], { revalidate: 60, tags: ["categories"] });
export const getCategoryById = cache(async (id: string) => cachedCategoryById(id));

async function fetchCategoryBySlug(slug: string) {
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
const cachedCategoryBySlug = unstable_cache(fetchCategoryBySlug, ["category-by-slug"], { revalidate: 60, tags: ["categories"] });
export const getCategoryBySlug = cache(async (slug: string) => cachedCategoryBySlug(slug));

async function fetchFeaturedProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      orderBy: [asc(productTable.createdAt)],
      where: and(
        eq(productTable.featured, true),
        eq(productTable.visible, true),
      ),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}
const cachedFeaturedProducts = unstable_cache(fetchFeaturedProducts, ["featured-products"], { revalidate: 60, tags: ["products"] });
export const getFeaturedProducts = cache(async (): Promise<ProductWithRelations[]> => cachedFeaturedProducts());

async function fetchProductById(id: string): Promise<null | ProductWithRelations> {
  try {
    return (
      (await db.query.productTable.findFirst({
        where: eq(productTable.id, id),
        with: {
          category: true,
          images: {
            orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
          },
          model: true,
        subcategory: true,
        },
      })) ?? null
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}
const cachedProductById = unstable_cache(fetchProductById, ["product-by-id"], { revalidate: 60, tags: ["products"] });
export const getProductById = cache(
  async (id: string): Promise<null | ProductWithRelations> => cachedProductById(id),
);

async function fetchProductCount(): Promise<number> {
  try {
    const [row] = await db.select({ value: count() }).from(productTable);
    return row?.value ?? 0;
  } catch (error) {
    console.error("Failed to count products:", error);
    return 0;
  }
}
const cachedProductCount = unstable_cache(fetchProductCount, ["product-count"], { revalidate: 60, tags: ["products"] });
export const getProductCount = cache(async (): Promise<number> => cachedProductCount());

async function fetchProductsByCategorySlug(
  slug: string,
): Promise<null | {
  category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;
  products: ProductWithRelations[];
  subcategories: Awaited<ReturnType<typeof getSubcategories>>;
}> {
  const category = await cachedCategoryBySlug(slug);
  if (!category) return null;

  try {
    const [products, subcategories] = await Promise.all([
      db.query.productTable.findMany({
        orderBy: [asc(productTable.createdAt)],
        where: and(
          eq(productTable.categoryId, category.id),
          eq(productTable.visible, true),
        ),
        with: {
          category: true,
          images: {
            orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
          },
          model: true,
        subcategory: true,
        },
      }),
      cachedSubcategories(category.id),
    ]);
    return { category, products, subcategories };
  } catch (error) {
    console.error("Failed to fetch products by category:", error);
    return { category, products: [], subcategories: [] };
  }
}
const cachedProductsByCategorySlug = unstable_cache(fetchProductsByCategorySlug, ["products-by-category-slug"], { revalidate: 60, tags: ["products", "categories"] });
export const getProductsByCategorySlug = cache(
  async (slug: string): Promise<null | {
    category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>;
    products: ProductWithRelations[];
    subcategories: Awaited<ReturnType<typeof getSubcategories>>;
  }> => cachedProductsByCategorySlug(slug),
);

/** Resolves a list of product ids (e.g. from the client-only wishlist) against real catalog data. */
export async function getProductsByIds(
  ids: string[],
): Promise<ProductWithRelations[]> {
  if (ids.length === 0) return [];
  try {
    return await db.query.productTable.findMany({
      where: inArray(productTable.id, ids),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch products by ids:", error);
    return [];
  }
}

async function fetchRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      limit,
      orderBy: [asc(productTable.createdAt)],
      where: and(
        eq(productTable.categoryId, categoryId),
        ne(productTable.id, excludeId),
        eq(productTable.visible, true),
      ),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch related products:", error);
    return [];
  }
}
const cachedRelatedProducts = unstable_cache(fetchRelatedProducts, ["related-products"], { revalidate: 60, tags: ["products"] });
export const getRelatedProducts = cache(
  async (
    categoryId: string,
    excludeId: string,
    limit = 4,
  ): Promise<ProductWithRelations[]> => cachedRelatedProducts(categoryId, excludeId, limit),
);

async function fetchSubcategories(categoryId: string) {
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
const cachedSubcategories = unstable_cache(fetchSubcategories, ["subcategories"], { revalidate: 60, tags: ["products"] });
export const getSubcategories = cache(async (categoryId: string) => cachedSubcategories(categoryId));

/** All subcategories with at least one product, i.e. the real "House" list — feeds the home page marquee and the collection sidebar's house count. */
async function fetchSubcategoriesWithCounts(): Promise<(Subcategory & { productCount: number })[]> {
  try {
    const subcategories = await db.query.subcategoryTable.findMany({
      orderBy: [asc(subcategoryTable.sortOrder)],
      with: { products: { columns: { id: true } } },
    });
    return subcategories
      .map(({ products, ...subcategory }) => ({
        ...subcategory,
        productCount: products.length,
      }))
      .filter((s) => s.productCount > 0);
  } catch (error) {
    console.error("Failed to fetch subcategories with counts:", error);
    return [];
  }
}
const cachedSubcategoriesWithCounts = unstable_cache(fetchSubcategoriesWithCounts, ["subcategories-with-counts"], { revalidate: 60, tags: ["products"] });
export const getSubcategoriesWithCounts = cache(
  async (): Promise<(Subcategory & { productCount: number })[]> => cachedSubcategoriesWithCounts(),
);

// The up-to-6 products an admin has flagged "on the table" (see
// setProductOnTable in catalog-admin.ts) for the homepage hero's table
// scene. `limit: 6` mirrors the cap the mutation enforces, in case the two
// ever drift. Displayed as 2 rows × 3 per line.
async function fetchTableProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      limit: MAX_TABLE_PRODUCTS,
      orderBy: [asc(productTable.tableSortOrder), asc(productTable.updatedAt)],
      where: and(
        eq(productTable.onTable, true),
        eq(productTable.visible, true),
      ),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch table products:", error);
    return [];
  }
}
const cachedTableProducts = unstable_cache(fetchTableProducts, ["table-products"], { revalidate: 60, tags: ["products"] });
export const getTableProducts = cache(
  async (): Promise<ProductWithRelations[]> => cachedTableProducts(),
);

/** Same shape as getAllProducts, scoped to storefront-visible products — use this (not getAllProducts) for any public-facing "all products" listing. */
async function fetchVisibleProducts(): Promise<ProductWithRelations[]> {
  try {
    return await db.query.productTable.findMany({
      orderBy: [asc(productTable.createdAt)],
      where: eq(productTable.visible, true),
      with: {
        category: true,
        images: {
          orderBy: (image, { asc: ascImage }) => ascImage(image.sortOrder),
        },
        model: true,
        subcategory: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch visible products:", error);
    return [];
  }
}
const cachedVisibleProducts = unstable_cache(fetchVisibleProducts, ["visible-products"], { revalidate: 60, tags: ["products"] });
export const getVisibleProducts = cache(
  async (): Promise<ProductWithRelations[]> => cachedVisibleProducts(),
);

// Lightweight variant for storefront collection pages — ships only fields the
// CollectionBrowser actually needs (filters + search + card), omitting heavy
// JSONB (features/specs), image galleries, and table-cotout. Cuts payload from
// ~11MB (2145 full products) to ~1.2MB on collection routes.
export type ProductListItem = {
  caseMaterial: string | null;
  caseSizeMm: number | null;
  category: { id: string; name: string; slug: string };
  categoryId: string;
  description: string;
  gemstone: string | null;
  id: string;
  image: string;
  inStock: boolean;
  metal: string | null;
  movement: string | null;
  name: string;
  price: number;
  ref: string;
  model: { name: string } | null;
  modelId: string | null;
  strapMaterial: string | null;
  subcategory: { name: string } | null;
  waterResistanceM: number | null;
};

async function fetchVisibleProductsLite(): Promise<ProductListItem[]> {
  try {
    const rows = await db.query.productTable.findMany({
      columns: {
        caseMaterial: true,
        caseSizeMm: true,
        categoryId: true,
        createdAt: false,
        description: true,
        featured: false,
        features: false,
        gemstone: true,
        id: true,
        image: true,
        inStock: true,
        metal: true,
        movement: true,
        name: true,
        onTable: false,
        price: true,
        ref: true,
        specs: false,
        strapMaterial: true,
        modelId: true,
        subcategoryId: true,
        tableCutoutUrl: false,
        tableSortOrder: false,
        updatedAt: false,
        visible: true,
        waterResistanceM: true,
      },
      orderBy: [asc(productTable.createdAt)],
      where: eq(productTable.visible, true),
      with: {
        category: { columns: { id: true, name: true, slug: true } },
        model: { columns: { name: true } },
        subcategory: { columns: { name: true } },
      },
    });
    return rows as unknown as ProductListItem[];
  } catch (error) {
    console.error("Failed to fetch visible products (lite):", error);
    return [];
  }
}
const cachedVisibleProductsLite = unstable_cache(fetchVisibleProductsLite, ["visible-products-lite"], { revalidate: 60, tags: ["products"] });
export const getVisibleProductsLite = cache(async (): Promise<ProductListItem[]> => cachedVisibleProductsLite());

async function fetchProductsByCategorySlugLite(
  slug: string,
): Promise<null | { category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>; products: ProductListItem[]; subcategories: Awaited<ReturnType<typeof getSubcategories>> }> {
  const category = await cachedCategoryBySlug(slug);
  if (!category) return null;
  try {
    const [products, subcategories] = await Promise.all([
      db.query.productTable.findMany({
        columns: {
          caseMaterial: true,
          caseSizeMm: true,
          categoryId: true,
          createdAt: false,
          description: true,
          featured: false,
          features: false,
          gemstone: true,
          id: true,
          image: true,
          inStock: true,
          metal: true,
          movement: true,
          name: true,
          onTable: false,
          price: true,
          ref: true,
          specs: false,
          strapMaterial: true,
          modelId: true,
        subcategoryId: true,
          tableCutoutUrl: false,
          tableSortOrder: false,
          updatedAt: false,
          visible: true,
          waterResistanceM: true,
        },
        orderBy: [asc(productTable.createdAt)],
        where: and(eq(productTable.categoryId, category.id), eq(productTable.visible, true)),
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          model: { columns: { name: true } },
          subcategory: { columns: { name: true } },
        },
      }),
      cachedSubcategories(category.id),
    ]);
    return { category, products: products as unknown as ProductListItem[], subcategories };
  } catch (error) {
    console.error("Failed to fetch products by category (lite):", error);
    return { category, products: [], subcategories: [] };
  }
}
const cachedProductsByCategorySlugLite = unstable_cache(fetchProductsByCategorySlugLite, ["products-by-category-slug-lite"], { revalidate: 60, tags: ["products", "categories"] });
export const getProductsByCategorySlugLite = cache(
  async (slug: string): Promise<null | { category: NonNullable<Awaited<ReturnType<typeof getCategoryBySlug>>>; products: ProductListItem[]; subcategories: Awaited<ReturnType<typeof getSubcategories>> }> => cachedProductsByCategorySlugLite(slug),
);
