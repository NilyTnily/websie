"use client";

import * as React from "react";

import type { Category, Model, Subcategory } from "~/db/schema";

import { Label } from "~/ui/primitives/label";

const selectClassName = `
  flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm
  shadow-xs outline-none
  focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
`;

interface CategorySubcategoryFieldsProps {
  categories: Category[];
  defaultCategoryId?: string;
  defaultModelId?: null | string;
  defaultSubcategoryId?: null | string;
  modelsBySubcategory?: Record<string, Model[]>;
  onCategoryChange?: (categoryId: string) => void;
  subcategoriesByCategory: Record<string, Subcategory[]>;
}

export function CategorySubcategoryFields({
  categories,
  defaultCategoryId,
  defaultModelId,
  defaultSubcategoryId,
  modelsBySubcategory = {},
  onCategoryChange,
  subcategoriesByCategory,
}: CategorySubcategoryFieldsProps) {
  const [categoryId, setCategoryId] = React.useState(
    defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [subcategoryId, setSubcategoryId] = React.useState(
    defaultSubcategoryId ?? "",
  );
  const [modelId, setModelId] = React.useState(defaultModelId ?? "");

  const options = subcategoriesByCategory[categoryId] ?? [];
  const modelOptions = modelsBySubcategory[subcategoryId] ?? [];

  return (
    <div
      className={`
        grid grid-cols-1 gap-4
        sm:grid-cols-3
      `}
    >
      <div className="space-y-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <select
          className={selectClassName}
          id="categoryId"
          name="categoryId"
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSubcategoryId("");
            setModelId("");
            onCategoryChange?.(e.target.value);
          }}
          required
          value={categoryId}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="subcategoryId">Subcategory</Label>
        <select
          className={selectClassName}
          id="subcategoryId"
          name="subcategoryId"
          onChange={(e) => {
            setSubcategoryId(e.target.value);
            setModelId("");
          }}
          value={subcategoryId}
        >
          <option value="">— None —</option>
          {options.map((subcategory) => (
            <option key={subcategory.id} value={subcategory.id}>
              {subcategory.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="modelId">Model</Label>
        <select
          className={selectClassName}
          id="modelId"
          name="modelId"
          onChange={(e) => setModelId(e.target.value)}
          value={modelId}
        >
          <option value="">— None —</option>
          {modelOptions.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
