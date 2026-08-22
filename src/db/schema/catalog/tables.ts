import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const categoryTable = pgTable("category", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  description: text("description").notNull(),
  id: text("id").primaryKey(),
  image: text("image").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subcategoryTable = pgTable(
  "subcategory",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("subcategory_category_id_idx").on(table.categoryId)],
);

// Free-text attribute columns (caseMaterial, movement, metal, gemstone, ...) are
// deliberately not Postgres enums: the storefront derives its filter facets from
// whatever values actually exist on in-stock products, so a new value an admin
// types in a product form shows up as a filter automatically, no migration needed.
export const productTable = pgTable(
  "product",
  {
    caseMaterial: text("case_material"),
    caseSizeMm: integer("case_size_mm"),
    categoryId: text("category_id")
      .notNull()
      .references(() => categoryTable.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: text("description").notNull(),
    featured: boolean("featured").default(false).notNull(),
    features: jsonb("features").$type<string[]>().notNull(),
    gemstone: text("gemstone"),
    id: text("id").primaryKey(),
    image: text("image").notNull(),
    inStock: boolean("in_stock").default(true).notNull(),
    metal: text("metal"),
    movement: text("movement"),
    name: text("name").notNull(),
    // "On the table" — up to 6 products featured with a background-removed
    // cutout in the homepage hero's table scene (2 rows × 3, see
    // setProductOnTable in catalog-admin.ts, which enforces the cap and
    // auto-generates the cutout).
    onTable: boolean("on_table").default(false).notNull(),
    price: integer("price").notNull(),
    ref: text("ref").notNull().unique(),
    specs: jsonb("specs").$type<Record<string, string>>().notNull(),
    strapMaterial: text("strap_material"),
    subcategoryId: text("subcategory_id").references(() => subcategoryTable.id, {
      onDelete: "set null",
    }),
    // Background-removed PNG for the table-scene overlay, generated on demand
    // the first time a product is set onTable — null until then. Kept separate
    // from `image` so the original catalog/PDP photo is never touched.
    tableCutoutUrl: text("table_cutout_url"),
    // Display position (0-5) among the up-to-6 onTable products, set by the
    // admin's drag-and-drop table arrangement (see setTableOrder in
    // catalog-admin.ts). Null for products never explicitly ordered — they
    // sort after any explicitly-ordered ones (see getTableProducts).
    tableSortOrder: integer("table_sort_order"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    // Controls storefront visibility independent of inStock (which still shows
    // the product with an "Out of Stock" overlay). Admin views always see
    // every product regardless of this flag.
    visible: boolean("visible").default(true).notNull(),
    waterResistanceM: integer("water_resistance_m"),
  },
  (table) => [
    index("product_visible_idx").on(table.visible),
    index("product_category_id_idx").on(table.categoryId),
    index("product_on_table_idx").on(table.onTable),
    index("product_featured_idx").on(table.featured),
    index("product_visible_category_idx").on(table.visible, table.categoryId),
  ],
);

// Additional gallery media beyond product.image (the cover shown in
// listings/cards, kept as-is to avoid touching every place that reads it).
// A "360" sequence is represented as multiple rows sharing mediaType "360"
// on one product, ordered by sortOrder — the frontend groups them into a
// single interactive viewer rather than showing each frame separately.
export const productImageTable = pgTable(
  "product_image",
  {
    id: text("id").primaryKey(),
    mediaType: text("media_type", { enum: ["image", "video", "360"] })
      .default("image")
      .notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => productTable.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
    url: text("url").notNull(),
  },
  (table) => [index("product_image_product_id_idx").on(table.productId)],
);
