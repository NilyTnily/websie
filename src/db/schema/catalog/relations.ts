import { relations } from "drizzle-orm";

import {
  categoryTable,
  productImageTable,
  productTable,
  subcategoryTable,
  watchModelTable,
} from "./tables";

export const categoryRelations = relations(categoryTable, ({ many }) => ({
  products: many(productTable),
  subcategories: many(subcategoryTable),
}));

export const subcategoryRelations = relations(
  subcategoryTable,
  ({ many, one }) => ({
    category: one(categoryTable, {
      fields: [subcategoryTable.categoryId],
      references: [categoryTable.id],
    }),
    models: many(watchModelTable),
    products: many(productTable),
  }),
);

export const watchModelRelations = relations(
  watchModelTable,
  ({ many, one }) => ({
    products: many(productTable),
    subcategory: one(subcategoryTable, {
      fields: [watchModelTable.subcategoryId],
      references: [subcategoryTable.id],
    }),
  }),
);

export const productRelations = relations(productTable, ({ many, one }) => ({
  category: one(categoryTable, {
    fields: [productTable.categoryId],
    references: [categoryTable.id],
  }),
  images: many(productImageTable),
  model: one(watchModelTable, {
    fields: [productTable.modelId],
    references: [watchModelTable.id],
  }),
  subcategory: one(subcategoryTable, {
    fields: [productTable.subcategoryId],
    references: [subcategoryTable.id],
  }),
}));

export const productImageRelations = relations(
  productImageTable,
  ({ one }) => ({
    product: one(productTable, {
      fields: [productImageTable.productId],
      references: [productTable.id],
    }),
  }),
);
