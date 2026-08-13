import {
  boolean,
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

export const subcategoryTable = pgTable("subcategory", {
  categoryId: text("category_id")
    .notNull()
    .references(() => categoryTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Free-text attribute columns (caseMaterial, movement, metal, gemstone, ...) are
// deliberately not Postgres enums: the storefront derives its filter facets from
// whatever values actually exist on in-stock products, so a new value an admin
// types in a product form shows up as a filter automatically, no migration needed.
export const productTable = pgTable("product", {
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
  price: integer("price").notNull(),
  ref: text("ref").notNull().unique(),
  specs: jsonb("specs").$type<Record<string, string>>().notNull(),
  strapMaterial: text("strap_material"),
  subcategoryId: text("subcategory_id").references(() => subcategoryTable.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  waterResistanceM: integer("water_resistance_m"),
});

// Additional gallery photos beyond product.image (the cover shown in
// listings/cards, kept as-is to avoid touching every place that reads it).
export const productImageTable = pgTable("product_image", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => productTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  url: text("url").notNull(),
});
