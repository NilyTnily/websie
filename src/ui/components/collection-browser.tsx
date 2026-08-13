"use client";

import { SlidersHorizontal } from "lucide-react";
import * as React from "react";

import type { CategoryWithCount, ProductWithRelations } from "~/db/schema";

import { cn } from "~/lib/cn";
import { useCart } from "~/lib/hooks/use-cart";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/ui/primitives/sheet";
import { Slider } from "~/ui/primitives/slider";

interface FacetConfig {
  getValue: (product: ProductWithRelations) => string | undefined;
  key: string;
  label: string;
}

type SortOption = "featured" | "name-asc" | "price-asc" | "price-desc";

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
];

// Every facet is admin-driven and category-agnostic: a facet group only renders
// when at least one product in the current scope actually has that attribute
// set, so adding a new category (or a new attribute value) never needs a code
// change here — it just shows up.
const ATTRIBUTE_FACETS: FacetConfig[] = [
  { getValue: (p) => p.subcategory?.name, key: "subcategory", label: "Type" },
  {
    getValue: (p) => p.movement ?? undefined,
    key: "movement",
    label: "Movement",
  },
  {
    getValue: (p) => p.caseMaterial ?? undefined,
    key: "caseMaterial",
    label: "Case Material",
  },
  {
    getValue: (p) => p.strapMaterial ?? undefined,
    key: "strapMaterial",
    label: "Strap Material",
  },
  {
    getValue: (p) =>
      p.waterResistanceM ? `${p.waterResistanceM}m` : undefined,
    key: "waterResistance",
    label: "Water Resistance",
  },
  { getValue: (p) => p.metal ?? undefined, key: "metal", label: "Metal" },
  {
    getValue: (p) => p.gemstone ?? undefined,
    key: "gemstone",
    label: "Gemstone",
  },
];

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

interface CollectionBrowserProps {
  categories: CategoryWithCount[];
  /** Seeds the category filter on first render (e.g. from a ?category= deep link). */
  initialCategoryId?: string;
  /** When set, the category filter is hidden and results are locked to it. */
  lockedCategoryId?: string;
  products: ProductWithRelations[];
}

export function CollectionBrowser({
  categories,
  initialCategoryId,
  lockedCategoryId,
  products,
}: CollectionBrowserProps) {
  const { addItem } = useCart();

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    null | string
  >(() => lockedCategoryId ?? initialCategoryId ?? null);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<SortOption>("featured");
  const [facetSelections, setFacetSelections] = React.useState<
    Record<string, string[]>
  >({});

  const resolvedCategoryId = lockedCategoryId ?? selectedCategoryId;

  const categoryScopedProducts = React.useMemo(
    () =>
      resolvedCategoryId
        ? products.filter((p) => p.categoryId === resolvedCategoryId)
        : products,
    [products, resolvedCategoryId],
  );

  React.useEffect(() => {
    void resolvedCategoryId;
    setFacetSelections({});
  }, [resolvedCategoryId]);

  const priceBounds = React.useMemo<[number, number]>(() => {
    if (categoryScopedProducts.length === 0) return [0, 0];
    const prices = categoryScopedProducts.map((p) => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [categoryScopedProducts]);

  const [priceRange, setPriceRange] = React.useState<[number, number]>(
    () => priceBounds,
  );
  const [minPriceBound, maxPriceBound] = priceBounds;

  React.useEffect(() => {
    setPriceRange([minPriceBound, maxPriceBound]);
  }, [minPriceBound, maxPriceBound]);

  const caseSizeBounds = React.useMemo<[number, number] | null>(() => {
    const sizes = categoryScopedProducts
      .map((p) => p.caseSizeMm)
      .filter((v): v is number => v !== null);
    if (sizes.length === 0) return null;
    return [Math.min(...sizes), Math.max(...sizes)];
  }, [categoryScopedProducts]);

  const [caseSizeRange, setCaseSizeRange] = React.useState<
    [number, number] | null
  >(() => caseSizeBounds);
  const minCaseSizeBound = caseSizeBounds?.[0] ?? null;
  const maxCaseSizeBound = caseSizeBounds?.[1] ?? null;

  React.useEffect(() => {
    setCaseSizeRange(
      minCaseSizeBound !== null && maxCaseSizeBound !== null
        ? [minCaseSizeBound, maxCaseSizeBound]
        : null,
    );
  }, [minCaseSizeBound, maxCaseSizeBound]);

  const toggleFacetValue = (key: string, value: string) => {
    setFacetSelections((prev) => {
      const current = prev[key] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const filteredProducts = React.useMemo(() => {
    const list = categoryScopedProducts.filter((p) => {
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (inStockOnly && !p.inStock) return false;
      if (
        caseSizeRange &&
        p.caseSizeMm !== null &&
        (p.caseSizeMm < caseSizeRange[0] || p.caseSizeMm > caseSizeRange[1])
      ) {
        return false;
      }
      return ATTRIBUTE_FACETS.every((facet) => {
        const selected = facetSelections[facet.key];
        if (!selected || selected.length === 0) return true;
        const value = facet.getValue(p);
        return value !== undefined && selected.includes(value);
      });
    });

    const sorted = [...list];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc")
      sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [
    categoryScopedProducts,
    priceRange,
    inStockOnly,
    caseSizeRange,
    facetSelections,
    sortBy,
  ]);

  const handleAddToCart = React.useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addItem(
          {
            category: product.category.name,
            id: product.id,
            image: product.image,
            name: product.name,
            price: product.price,
          },
          1,
        );
      }
    },
    [addItem, products],
  );

  const isPriceFiltered =
    priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1];
  const isCaseSizeFiltered =
    !!caseSizeBounds &&
    !!caseSizeRange &&
    (caseSizeRange[0] !== caseSizeBounds[0] ||
      caseSizeRange[1] !== caseSizeBounds[1]);
  const hasFacetSelections = Object.values(facetSelections).some(
    (v) => v.length > 0,
  );
  const hasActiveFilters =
    (!lockedCategoryId && selectedCategoryId !== null) ||
    inStockOnly ||
    isPriceFiltered ||
    isCaseSizeFiltered ||
    hasFacetSelections;

  const resetFilters = () => {
    if (!lockedCategoryId) setSelectedCategoryId(null);
    setInStockOnly(false);
    setPriceRange(priceBounds);
    if (caseSizeBounds) setCaseSizeRange(caseSizeBounds);
    setFacetSelections({});
  };

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategoryId && (
        <div>
          <h3 className="krs-ref text-[11px] text-muted-foreground">
            Category
          </h3>
          <ul className="mt-3 space-y-2">
            <li>
              <button
                className={cn(
                  "text-sm transition-colors",
                  selectedCategoryId === null
                    ? "font-medium text-primary"
                    : `
                      text-muted-foreground
                      hover:text-foreground
                    `,
                )}
                onClick={() => setSelectedCategoryId(null)}
                type="button"
              >
                All Pieces
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  className={cn(
                    "text-sm transition-colors",
                    selectedCategoryId === category.id
                      ? "font-medium text-primary"
                      : `
                        text-muted-foreground
                        hover:text-foreground
                      `,
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                  type="button"
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ATTRIBUTE_FACETS.map((facet) => {
        const options = uniqueValues(categoryScopedProducts, facet.getValue);
        if (options.length === 0) return null;
        const selected = facetSelections[facet.key] ?? [];

        return (
          <div key={facet.key}>
            <h3 className="krs-ref text-[11px] text-muted-foreground">
              {facet.label}
            </h3>
            <ul className="mt-3 space-y-2">
              {options.map((option) => (
                <li key={option}>
                  <label
                    className={`
                      flex cursor-pointer items-center gap-2 text-sm
                      text-foreground
                    `}
                    htmlFor={`facet-${facet.key}-${option}`}
                  >
                    <Checkbox
                      checked={selected.includes(option)}
                      id={`facet-${facet.key}-${option}`}
                      onCheckedChange={() =>
                        toggleFacetValue(facet.key, option)
                      }
                    />
                    {option}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {caseSizeBounds && caseSizeRange && (
        <div>
          <h3 className="krs-ref text-[11px] text-muted-foreground">
            Case Size
          </h3>
          <Slider
            className="mt-4"
            max={caseSizeBounds[1]}
            min={caseSizeBounds[0]}
            onValueChange={(value) =>
              setCaseSizeRange(value as [number, number])
            }
            step={1}
            value={caseSizeRange}
          />
          <div
            className={`
              krs-ref mt-3 flex items-center justify-between text-xs
              text-muted-foreground
            `}
          >
            <span>{caseSizeRange[0]}mm</span>
            <span>{caseSizeRange[1]}mm</span>
          </div>
        </div>
      )}

      <div>
        <h3 className="krs-ref text-[11px] text-muted-foreground">Price</h3>
        <Slider
          className="mt-4"
          max={priceBounds[1]}
          min={priceBounds[0]}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          step={50}
          value={priceRange}
        />
        <div
          className={`
            krs-ref mt-3 flex items-center justify-between text-xs
            text-muted-foreground
          `}
        >
          <span>{CURRENCY_FORMATTER.format(priceRange[0])}</span>
          <span>{CURRENCY_FORMATTER.format(priceRange[1])}</span>
        </div>
      </div>

      <div>
        <h3 className="krs-ref text-[11px] text-muted-foreground">
          Availability
        </h3>
        <label
          className={`
            mt-3 flex cursor-pointer items-center gap-2 text-sm text-foreground
          `}
          htmlFor="in-stock-only"
        >
          <Checkbox
            checked={inStockOnly}
            id="in-stock-only"
            onCheckedChange={(checked) => setInStockOnly(checked === true)}
          />
          In stock only
        </label>
      </div>

      {hasActiveFilters && (
        <Button
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={resetFilters}
          variant="link"
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div
      className={`
        flex flex-col gap-10
        lg:flex-row
      `}
    >
      <aside
        className={`
          hidden w-56 shrink-0
          lg:block
        `}
      >
        {filterPanel}
      </aside>

      <div className="min-w-0 flex-1">
        <div
          className={`
            mb-6 flex items-center justify-between gap-4 border-b border-border
            pb-4
          `}
        >
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} piece
            {filteredProducts.length === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  className={`
                    gap-1.5
                    lg:hidden
                  `}
                  size="sm"
                  variant="outline"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent
                className={`
                  w-[85%] overflow-y-auto p-6
                  sm:max-w-xs
                `}
                side="left"
              >
                <SheetTitle className="font-display text-lg">Filter</SheetTitle>
                <div className="mt-6">{filterPanel}</div>
                <SheetClose asChild>
                  <Button className="mt-8 w-full">
                    Show {filteredProducts.length} pieces
                  </Button>
                </SheetClose>
              </SheetContent>
            </Sheet>

            <select
              aria-label="Sort products"
              className={`
                h-8 border border-input bg-transparent px-2 text-xs
                text-foreground
                focus-visible:outline-none
              `}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              value={sortBy}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`
            grid grid-cols-1 gap-6
            sm:grid-cols-2
            xl:grid-cols-3
          `}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              onAddToCart={handleAddToCart}
              product={toCardProduct(product)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Nothing matches these filters right now.
            </p>
            <Button className="mt-4" onClick={resetFilters} variant="outline">
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function toCardProduct(product: ProductWithRelations) {
  return {
    category: product.category.name,
    id: product.id,
    image: product.image,
    inStock: product.inStock,
    name: product.name,
    price: product.price,
    ref: product.ref,
  };
}

function uniqueValues(
  products: ProductWithRelations[],
  getValue: FacetConfig["getValue"],
): string[] {
  const values = new Set<string>();
  for (const product of products) {
    const value = getValue(product);
    if (value) values.add(value);
  }
  return [...values].sort();
}
