"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { Category, Subcategory } from "~/db/schema";

import { UploadButton } from "~/lib/uploadthing";
import { Button } from "~/ui/primitives/button";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

import type { ProductFormState } from "./actions";

import { CategorySubcategoryFields } from "./category-subcategory-fields";
import { ProductAttributesEditor } from "./product-attributes-editor";
import { ProductGalleryEditor } from "./product-gallery-editor";

const textareaClassName = `
  flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm
  shadow-xs outline-none
  focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
`;

interface ProductFormDefaultValues {
  caseMaterial: null | string;
  caseSizeMm: null | number;
  categoryId: string;
  description: string;
  featured: boolean;
  features: string[];
  gemstone: null | string;
  image: string;
  images: string[];
  inStock: boolean;
  metal: null | string;
  movement: null | string;
  name: string;
  price: number;
  ref: string;
  specs: Record<string, string>;
  strapMaterial: null | string;
  subcategoryId: null | string;
  waterResistanceM: null | number;
}

interface ProductFormProps {
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  categories: Category[];
  defaultValues?: ProductFormDefaultValues;
  subcategoriesByCategory: Record<string, Subcategory[]>;
  submitLabel: string;
}

export function ProductForm({
  action,
  categories,
  defaultValues,
  subcategoriesByCategory,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState<
    ProductFormState,
    FormData
  >(action, {});

  const [categoryId, setCategoryId] = useState(
    defaultValues?.categoryId ?? categories[0]?.id ?? "",
  );
  const [imageUrl, setImageUrl] = useState(defaultValues?.image ?? "");
  const selectedCategoryName =
    categories.find((category) => category.id === categoryId)?.name ?? "";
  const isJewelry = selectedCategoryName.toLowerCase().includes("jewel");

  const featuresText = defaultValues?.features.join("\n") ?? "";

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            defaultValue={defaultValues?.name}
            id="name"
            name="name"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            className={`
              ${textareaClassName}
              min-h-24
            `}
            defaultValue={defaultValues?.description}
            id="description"
            name="description"
            required
          />
        </div>

        <div
          className={`
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          `}
        >
          <div className="space-y-1.5">
            <Label htmlFor="image">Image</Label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <div
                  className={`
                    relative h-14 w-14 shrink-0 overflow-hidden rounded-md
                    border bg-muted
                  `}
                >
                  <Image
                    alt="Product preview"
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={imageUrl}
                  />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  id="image"
                  name="image"
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https:// or upload a file"
                  required
                  value={imageUrl}
                />
                <UploadButton
                  appearance={{
                    button: "h-8 px-3 text-xs",
                    container: "items-start",
                  }}
                  content={{ button: "Browse for photo" }}
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    const uploaded = res[0]?.ufsUrl;
                    if (uploaded) setImageUrl(uploaded);
                  }}
                  onUploadError={(uploadError: Error) => {
                    toast.error(`Upload failed: ${uploadError.message}`);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ref">Reference Number</Label>
            <Input
              defaultValue={defaultValues?.ref}
              id="ref"
              name="ref"
              required
            />
          </div>
        </div>

        <div
          className={`
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          `}
        >
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              defaultValue={defaultValues?.price}
              id="price"
              max={2147483647}
              min={0}
              name="price"
              required
              step={1}
              type="number"
            />
          </div>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                defaultChecked={defaultValues?.inStock ?? true}
                name="inStock"
                type="checkbox"
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                defaultChecked={defaultValues?.featured ?? false}
                name="featured"
                type="checkbox"
              />
              Featured on homepage
            </label>
          </div>
        </div>

        <CategorySubcategoryFields
          categories={categories}
          defaultCategoryId={defaultValues?.categoryId}
          defaultSubcategoryId={defaultValues?.subcategoryId}
          onCategoryChange={setCategoryId}
          subcategoriesByCategory={subcategoriesByCategory}
        />
      </div>

      <ProductGalleryEditor defaultImages={defaultValues?.images ?? []} />

      <div className="space-y-4 border-t pt-6">
        <div className="space-y-1.5">
          <Label htmlFor="features">Features (one per line)</Label>
          <textarea
            className={`
              ${textareaClassName}
              min-h-28 font-mono text-xs
            `}
            defaultValue={featuresText}
            id="features"
            name="features"
          />
        </div>
      </div>

      <ProductAttributesEditor
        defaultCoreValues={{
          caseMaterial: defaultValues?.caseMaterial ?? null,
          caseSizeMm: defaultValues?.caseSizeMm ?? null,
          gemstone: defaultValues?.gemstone ?? null,
          metal: defaultValues?.metal ?? null,
          movement: defaultValues?.movement ?? null,
          strapMaterial: defaultValues?.strapMaterial ?? null,
          waterResistanceM: defaultValues?.waterResistanceM ?? null,
        }}
        defaultSpecs={defaultValues?.specs ?? {}}
        isJewelry={isJewelry}
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button disabled={isPending} type="submit">
        {isPending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
