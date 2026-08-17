"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import type { CategoryWithCount, ProductWithRelations } from "~/db/schema";

import { cn } from "~/lib/cn";
import { ProductCard } from "~/ui/components/product-card";
import { Button } from "~/ui/primitives/button";
import { Checkbox } from "~/ui/primitives/checkbox";
import { Input } from "~/ui/primitives/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "~/ui/primitives/sheet";
import { Slider } from "~/ui/primitives/slider";

type SortOption = "featured" | "name-asc" | "price-asc" | "price-desc";

const SORT_VALUES: SortOption[] = [
  "featured",
  "price-asc",
  "price-desc",
  "name-asc",
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A to Z", value: "name-asc" },
];

interface PriceBand {
  key: string;
  label: string;
  max: number;
  min: number;
}

const PRICE_BANDS: PriceBand[] = [
  { key: "under-5k", label: "Under $5,000", max: 5_000, min: 0 },
  { key: "5k-25k", label: "$5,000 – $25,000", max: 25_000, min: 5_000 },
  {
    key: "25k-100k",
    label: "$25,000 – $100,000",
    max: 100_000,
    min: 25_000,
  },
  {
    key: "100k-plus",
    label: "$100,000 and above",
    max: Number.POSITIVE_INFINITY,
    min: 100_000,
  },
];

const PAGE_SIZE = 24;
const HOUSES_SHOWN_COLLAPSED = 6;

const collectionSearchParams = {
  house: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  price: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("featured"),
};

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
  const [
    { house: selectedHouses, page, price: priceBandKey, search: searchQuery, sort: sortBy },
    setQuery,
  ] = useQueryStates(collectionSearchParams);

  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    null | string
  >(() => lockedCategoryId ?? initialCategoryId ?? null);
  const [caseSizeRange, setCaseSizeRange] = React.useState<
    [number, number] | null
  >(null);

  const resolvedCategoryId = lockedCategoryId ?? selectedCategoryId;

  const categoryScopedProducts = React.useMemo(
    () =>
      resolvedCategoryId
        ? products.filter((p) => p.categoryId === resolvedCategoryId)
        : products,
    [products, resolvedCategoryId],
  );

  const houseOptions = React.useMemo(
    () => uniqueHouses(categoryScopedProducts),
    [categoryScopedProducts],
  );
  const [showAllHouses, setShowAllHouses] = React.useState(false);
  const visibleHouseOptions = showAllHouses
    ? houseOptions
    : houseOptions.slice(0, HOUSES_SHOWN_COLLAPSED);

  const caseSizeBounds = React.useMemo<[number, number] | null>(() => {
    const sizes = categoryScopedProducts
      .map((p) => p.caseSizeMm)
      .filter((v): v is number => v !== null);
    if (sizes.length === 0) return null;
    return [Math.min(...sizes), Math.max(...sizes)];
  }, [categoryScopedProducts]);

  const minCaseSizeBound = caseSizeBounds?.[0] ?? null;
  const maxCaseSizeBound = caseSizeBounds?.[1] ?? null;

  React.useEffect(() => {
    setCaseSizeRange(
      minCaseSizeBound !== null && maxCaseSizeBound !== null
        ? [minCaseSizeBound, maxCaseSizeBound]
        : null,
    );
  }, [minCaseSizeBound, maxCaseSizeBound]);

  const toggleHouse = (house: string) => {
    const next = selectedHouses.includes(house)
      ? selectedHouses.filter((h) => h !== house)
      : [...selectedHouses, house];
    void setQuery({ house: next, page: 1 });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activePriceBand = PRICE_BANDS.find((b) => b.key === priceBandKey);

  const filteredProducts = React.useMemo(() => {
    const list = categoryScopedProducts.filter((p) => {
      if (
        normalizedQuery &&
        !p.name.toLowerCase().includes(normalizedQuery) &&
        !p.ref.toLowerCase().includes(normalizedQuery) &&
        !p.description.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      if (
        activePriceBand &&
        (p.price < activePriceBand.min || p.price >= activePriceBand.max)
      ) {
        return false;
      }
      if (
        caseSizeRange &&
        p.caseSizeMm !== null &&
        (p.caseSizeMm < caseSizeRange[0] || p.caseSizeMm > caseSizeRange[1])
      ) {
        return false;
      }
      if (selectedHouses.length > 0) {
        const house = p.subcategory?.name;
        if (!house || !selectedHouses.includes(house)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc")
      sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [
    categoryScopedProducts,
    normalizedQuery,
    activePriceBand,
    caseSizeRange,
    selectedHouses,
    sortBy,
  ]);

  // Any filter change invalidates the current page — jump back to the top of
  // the results rather than possibly landing on a now-empty page.
  React.useEffect(() => {
    void setQuery({ page: 1 });
  }, [resolvedCategoryId, normalizedQuery, priceBandKey, selectedHouses.join(",")]);

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const isCaseSizeFiltered =
    !!caseSizeBounds &&
    !!caseSizeRange &&
    (caseSizeRange[0] !== caseSizeBounds[0] ||
      caseSizeRange[1] !== caseSizeBounds[1]);

  const hasActiveFilters =
    (!lockedCategoryId && selectedCategoryId !== null) ||
    normalizedQuery.length > 0 ||
    !!activePriceBand ||
    isCaseSizeFiltered ||
    selectedHouses.length > 0;

  const resetFilters = () => {
    if (!lockedCategoryId) setSelectedCategoryId(null);
    if (caseSizeBounds) setCaseSizeRange(caseSizeBounds);
    void setQuery({ house: [], page: 1, price: "", search: "" });
  };

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategoryId && (
        <div>
          <h3 className="krs-eyebrow text-krs-tobacco">Category</h3>
          <ul className="mt-3 space-y-2">
            <li>
              <button
                className={cn(
                  "text-sm transition-colors",
                  selectedCategoryId === null
                    ? "font-medium text-foreground"
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
                    `
                      flex w-full items-center justify-between text-sm
                      transition-colors
                    `,
                    selectedCategoryId === category.id
                      ? "font-medium text-foreground"
                      : `
                        text-muted-foreground
                        hover:text-foreground
                      `,
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                  type="button"
                >
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">
                    {category.productCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {houseOptions.length > 0 && (
        <div>
          <h3 className="krs-eyebrow text-krs-tobacco">House</h3>
          <ul className="mt-3 space-y-2">
            {visibleHouseOptions.map((house) => (
              <li key={house}>
                <label
                  className={`
                    flex cursor-pointer items-center gap-2 text-sm
                    text-foreground
                  `}
                  htmlFor={`house-${house}`}
                >
                  <Checkbox
                    checked={selectedHouses.includes(house)}
                    id={`house-${house}`}
                    onCheckedChange={() => toggleHouse(house)}
                  />
                  {house}
                </label>
              </li>
            ))}
          </ul>
          {houseOptions.length > HOUSES_SHOWN_COLLAPSED && (
            <button
              className={`
                krs-meta mt-3 text-krs-champagne
                hover:text-krs-champagne-light
              `}
              onClick={() => setShowAllHouses((v) => !v)}
              type="button"
            >
              {showAllHouses
                ? "Show fewer"
                : `+ ${houseOptions.length - HOUSES_SHOWN_COLLAPSED} more`}
            </button>
          )}
        </div>
      )}

      <div>
        <h3 className="krs-eyebrow text-krs-tobacco">Price</h3>
        <ul className="mt-3 space-y-2">
          {PRICE_BANDS.map((band) => (
            <li key={band.key}>
              <label
                className={`
                  flex cursor-pointer items-center gap-2 text-sm text-foreground
                `}
                htmlFor={`price-${band.key}`}
              >
                <Checkbox
                  checked={priceBandKey === band.key}
                  id={`price-${band.key}`}
                  onCheckedChange={() =>
                    void setQuery({
                      page: 1,
                      price: priceBandKey === band.key ? "" : band.key,
                    })
                  }
                />
                {band.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {caseSizeBounds && caseSizeRange && (
        <div>
          <h3 className="krs-eyebrow text-krs-tobacco">Case Size</h3>
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
              krs-meta mt-3 flex items-center justify-between text-xs
              text-muted-foreground
            `}
          >
            <span>{caseSizeRange[0]}mm</span>
            <span>{caseSizeRange[1]}mm</span>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <Button
          className="h-auto p-0 text-xs text-krs-champagne"
          onClick={resetFilters}
          variant="link"
        >
          Clear all
        </Button>
      )}
    </div>
  );

  const activeFilterChips: { key: string; label: string; onClear: () => void }[] = [];
  if (!lockedCategoryId && selectedCategoryId) {
    const category = categories.find((c) => c.id === selectedCategoryId);
    if (category) {
      activeFilterChips.push({
        key: `category-${category.id}`,
        label: category.name,
        onClear: () => setSelectedCategoryId(null),
      });
    }
  }
  for (const house of selectedHouses) {
    activeFilterChips.push({
      key: `house-${house}`,
      label: house,
      onClear: () => toggleHouse(house),
    });
  }
  if (activePriceBand) {
    activeFilterChips.push({
      key: `price-${activePriceBand.key}`,
      label: activePriceBand.label,
      onClear: () => void setQuery({ page: 1, price: "" }),
    });
  }
  if (isCaseSizeFiltered && caseSizeRange) {
    activeFilterChips.push({
      key: "case-size",
      label: `Case ${caseSizeRange[0]}–${caseSizeRange[1]}mm`,
      onClear: () => caseSizeBounds && setCaseSizeRange(caseSizeBounds),
    });
  }

  return (
    <div
      className={`
        flex flex-col gap-10
        lg:flex-row
      `}
    >
      <aside
        className={`
          hidden w-[232px] shrink-0
          lg:block
        `}
      >
        {filterPanel}
      </aside>

      <div className="min-w-0 flex-1">
        <div
          className={`
            mb-6 flex flex-col gap-4
            sm:flex-row sm:items-center sm:justify-between
          `}
        >
          <div className="relative max-w-[300px] flex-1">
            <Search
              className={`
                pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5
                -translate-y-1/2 text-muted-foreground
              `}
            />
            <Input
              aria-label="Search the collection"
              className="h-[42px] rounded-none pl-9"
              onChange={(e) => void setQuery({ page: 1, search: e.target.value })}
              placeholder="Name, house or reference"
              type="text"
              value={searchQuery}
            />
            {searchQuery && (
              <button
                aria-label="Clear search"
                className={`
                  absolute top-1/2 right-3 -translate-y-1/2
                  text-muted-foreground
                  hover:text-foreground
                `}
                onClick={() => void setQuery({ page: 1, search: "" })}
                type="button"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  className={`
                    h-[42px] gap-1.5 rounded-none
                    lg:hidden
                  `}
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
                  <Button className="mt-8 w-full rounded-none">
                    Show {filteredProducts.length} pieces
                  </Button>
                </SheetClose>
              </SheetContent>
            </Sheet>

            <select
              aria-label="Sort products"
              className={`
                h-[42px] border border-input bg-transparent px-3 text-xs
                text-foreground
                focus-visible:outline-none
              `}
              onChange={(e) =>
                void setQuery({
                  page: 1,
                  sort: e.target.value as SortOption,
                })
              }
              value={sortBy}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort · {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <button
                className={`
                  krs-meta flex items-center gap-2 border border-primary px-3
                  py-1.5 text-xs text-foreground
                `}
                key={chip.key}
                onClick={chip.onClear}
                type="button"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div
          className={`
            mb-6 flex items-center justify-between border-b border-border pb-4
          `}
        >
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} piece
            {filteredProducts.length === 1 ? "" : "s"}
          </p>
        </div>

        <div
          className={`
            grid grid-cols-1 gap-x-7 gap-y-9
            sm:grid-cols-2
            xl:grid-cols-3
          `}
        >
          {pagedProducts.map((product) => (
            <ProductCard key={product.id} product={toCardProduct(product)} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Nothing matches these filters right now.
            </p>
            <Button
              className="mt-4 rounded-none"
              onClick={resetFilters}
              variant="outline"
            >
              Clear filters
            </Button>
          </div>
        )}

        {pageCount > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-10 flex items-center justify-center gap-2"
          >
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                aria-current={n === currentPage ? "page" : undefined}
                className={cn(
                  `
                    krs-meta flex h-[34px] w-[34px] items-center justify-center
                    border border-border text-xs
                  `,
                  n === currentPage
                    ? "border-primary bg-primary text-primary-foreground"
                    : `
                      text-foreground
                      hover:border-primary
                    `,
                )}
                key={n}
                onClick={() => void setQuery({ page: n })}
                type="button"
              >
                {n}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function toCardProduct(product: ProductWithRelations) {
  return {
    house: product.subcategory?.name ?? product.category.name,
    id: product.id,
    image: product.image,
    inStock: product.inStock,
    name: product.name,
    price: product.price,
    ref: product.ref,
  };
}

function uniqueHouses(products: ProductWithRelations[]): string[] {
  const values = new Set<string>();
  for (const product of products) {
    const house = product.subcategory?.name;
    if (house) values.add(house);
  }
  return [...values].sort();
}
