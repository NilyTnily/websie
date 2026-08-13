import type {
  categoryTable,
  productImageTable,
  productTable,
  subcategoryTable,
} from "./tables";

export type Category = typeof categoryTable.$inferSelect;
export interface CategoryWithCount extends Category {
  productCount: number;
}

export type NewCategory = typeof categoryTable.$inferInsert;
export type NewProduct = typeof productTable.$inferInsert;
export type NewProductImage = typeof productImageTable.$inferInsert;

export type NewSubcategory = typeof subcategoryTable.$inferInsert;
export type Product = typeof productTable.$inferSelect;
export type ProductImage = typeof productImageTable.$inferSelect;

export interface ProductWithRelations extends Product {
  category: Category;
  images: ProductImage[];
  subcategory: null | Subcategory;
}

export type Subcategory = typeof subcategoryTable.$inferSelect;
