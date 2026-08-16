"use server";

import { redirect } from "next/navigation";

import type {
  ProductInput,
  ProductMediaInput,
} from "~/lib/queries/catalog-admin";

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "~/lib/queries/catalog-admin";

export interface ProductFormState {
  error?: string;
}

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const built = buildProductInput(formData);
  if ("error" in built) return { error: built.error };

  const result = await createProduct(built.input, parseGalleryMedia(formData));
  if (!result.success) return { error: result.error };
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  await deleteProduct(id);
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const built = buildProductInput(formData);
  if ("error" in built) return { error: built.error };

  const result = await updateProduct(
    id,
    built.input,
    parseGalleryMedia(formData),
  );
  if (!result.success) return { error: result.error };
  redirect("/admin/products");
}

// Postgres `integer` columns are 4 bytes — anything outside this range
// throws a raw DB error instead of a usable validation message.
const POSTGRES_INT_MAX = 2147483647;
const POSTGRES_INT_MIN = -2147483648;

function buildProductInput(
  formData: FormData,
): { error: string } | { input: ProductInput } {
  const name = textField(formData, "name");
  const description = textField(formData, "description");
  const image = textField(formData, "image");
  const ref = textField(formData, "ref");
  const categoryId = textField(formData, "categoryId");
  const priceRaw = textField(formData, "price");
  const price = Number.parseInt(priceRaw, 10);

  if (!name || !description || !image || !ref || !categoryId || !priceRaw) {
    return {
      error:
        "Name, description, image, reference, category, and price are required.",
    };
  }

  if (!isValidImageUrl(image)) {
    return {
      error:
        "Image must be a valid URL (https://…) or an uploaded file — got a plain word instead.",
    };
  }

  if (!Number.isFinite(price) || price < 0 || price > POSTGRES_INT_MAX) {
    return {
      error: `Price must be a number between 0 and ${POSTGRES_INT_MAX.toLocaleString()}.`,
    };
  }

  const caseSizeMm = optionalInt(formData, "caseSizeMm");
  const waterResistanceM = optionalInt(formData, "waterResistanceM");
  if (caseSizeMm === "out-of-range" || waterResistanceM === "out-of-range") {
    return {
      error: `Case size and water resistance must be numbers between ${POSTGRES_INT_MIN.toLocaleString()} and ${POSTGRES_INT_MAX.toLocaleString()}.`,
    };
  }

  return {
    input: {
      caseMaterial: optionalText(formData, "caseMaterial"),
      caseSizeMm,
      categoryId,
      description,
      featured: formData.get("featured") === "on",
      features: parseFeatures(textField(formData, "features")),
      gemstone: optionalText(formData, "gemstone"),
      image,
      inStock: formData.get("inStock") === "on",
      metal: optionalText(formData, "metal"),
      movement: optionalText(formData, "movement"),
      name,
      price,
      ref,
      specs: parseSpecs(textField(formData, "specs")),
      strapMaterial: optionalText(formData, "strapMaterial"),
      subcategoryId: optionalText(formData, "subcategoryId"),
      waterResistanceM,
    },
  };
}

function isValidImageUrl(value: string): boolean {
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function optionalInt(
  formData: FormData,
  key: string,
): "out-of-range" | null | number {
  const value = textField(formData, key);
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return null;
  if (n < POSTGRES_INT_MIN || n > POSTGRES_INT_MAX) return "out-of-range";
  return n;
}

function optionalText(formData: FormData, key: string): null | string {
  return textField(formData, key) || null;
}

function parseFeatures(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const MEDIA_TYPES = new Set(["360", "image", "video"]);

function parseGalleryMedia(formData: FormData): ProductMediaInput[] {
  const raw = textField(formData, "galleryImages");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ProductMediaInput => {
      if (typeof item !== "object" || item === null) return false;
      const { mediaType, url } = item as Record<string, unknown>;
      return (
        typeof url === "string" &&
        isValidImageUrl(url) &&
        typeof mediaType === "string" &&
        MEDIA_TYPES.has(mediaType)
      );
    });
  } catch {
    return [];
  }
}

function parseSpecs(raw: string): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

function textField(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}
