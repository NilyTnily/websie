"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
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
import { useSiteSettings } from "~/lib/hooks/use-site-settings";
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

interface WaterBand {
  key: string;
  label: string;
  max: number;
  min: number;
}

const WATER_BANDS: WaterBand[] = [
  { key: "w-30", label: "30m", max: 30, min: 0 },
  { key: "w-50", label: "50m", max: 100, min: 50 },
  { key: "w-100", label: "100m", max: 200, min: 100 },
  { key: "w-200", label: "200m+", max: 10000, min: 200 },
];

const PAGE_SIZE = 24;
const FACET_COLLAPSED = 6;

const collectionSearchParams = {
  caseMat: parseAsArrayOf(parseAsString).withDefault([]),
  gem: parseAsArrayOf(parseAsString).withDefault([]),
  house: parseAsArrayOf(parseAsString).withDefault([]),
  inStock: parseAsString.withDefault(""),
  metal: parseAsArrayOf(parseAsString).withDefault([]),
  movement: parseAsArrayOf(parseAsString).withDefault([]),
  page: parseAsInteger.withDefault(1),
  price: parseAsArrayOf(parseAsString).withDefault([]),
  search: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORT_VALUES).withDefault("featured"),
  strap: parseAsArrayOf(parseAsString).withDefault([]),
  water: parseAsArrayOf(parseAsString).withDefault([]),
};

interface CollectionBrowserProps {
  categories: CategoryWithCount[];
  initialCategoryId?: string;
  lockedCategoryId?: string;
  products: ProductWithRelations[];
}

export function CollectionBrowser({
  categories,
  initialCategoryId,
  lockedCategoryId,
  products,
}: CollectionBrowserProps) {
  const { noMoneyMode } = useSiteSettings();

  const [
    {
      caseMat: selectedCaseMats,
      gem: selectedGems,
      house: selectedHouses,
      inStock: inStockFilter,
      metal: selectedMetals,
      movement: selectedMovements,
      page,
      price: selectedPriceKeys,
      search: searchQuery,
      sort: sortBy,
      strap: selectedStraps,
      water: selectedWaters,
    },
    setQuery,
  ] = useQueryStates(collectionSearchParams);

  // Clear price param when entering noMoneyMode (your critical requirement)
  React.useEffect(() => {
    if (noMoneyMode && selectedPriceKeys.length > 0) {
      void setQuery({ price: [], page: 1 });
    }
  }, [noMoneyMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy single ?price=under-5k support: if URL still has old string via manual share, array parse handles it as ["under-5k"]

  const sortOptions = noMoneyMode
    ? SORT_OPTIONS.filter((o) => o.value !== "price-asc" && o.value !== "price-desc")
    : SORT_OPTIONS;

  // Ensure sort is valid when noMoneyMode toggles
  React.useEffect(() => {
    if (noMoneyMode && (sortBy === "price-asc" || sortBy === "price-desc")) {
      void setQuery({ sort: "featured", page: 1 });
    }
  }, [noMoneyMode, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Resolve current category slug for contextual labels
  const resolvedCategory = React.useMemo(() => {
    if (!resolvedCategoryId) return null;
    return categories.find((c) => c.id === resolvedCategoryId) ?? null;
  }, [categories, resolvedCategoryId]);
  // For locked pages categories=[] so fall back to slug inference from products
  const isJewelryLocked = lockedCategoryId
    ? categoryScopedProducts.some((p) => p.category.slug === "fine-jewelry") &&
      !categoryScopedProducts.some((p) => p.category.slug === "timepieces")
    : false;
  const isWatchesLocked = lockedCategoryId
    ? categoryScopedProducts.some((p) => p.category.slug === "timepieces") &&
      !categoryScopedProducts.some((p) => p.category.slug === "fine-jewelry")
    : false;
  const isJewelryContext =
    isJewelryLocked || resolvedCategory?.slug === "fine-jewelry";
  const isWatchesContext =
    isWatchesLocked || resolvedCategory?.slug === "timepieces";

  // Facet builders
  const houseFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.subcategory?.name ?? null),
    [categoryScopedProducts],
  );
  const movementFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.movement),
    [categoryScopedProducts],
  );
  const caseMatFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.caseMaterial),
    [categoryScopedProducts],
  );
  const strapFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.strapMaterial),
    [categoryScopedProducts],
  );
  const metalFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.metal),
    [categoryScopedProducts],
  );
  const gemFacet = React.useMemo(
    () => facetFrom(categoryScopedProducts, (p) => p.gemstone),
    [categoryScopedProducts],
  );
  const waterFacet = React.useMemo(() => {
    // Only derive water options that actually occur as buckets
    const bucketsPresent = new Set<string>();
    for (const p of categoryScopedProducts) {
      if (p.waterResistanceM == null) continue;
      for (const b of WATER_BANDS) {
        if (p.waterResistanceM >= b.min && p.waterResistanceM < b.max) {
          bucketsPresent.add(b.key);
          break;
        }
        if (b.key === "w-200" && p.waterResistanceM >= 200) bucketsPresent.add(b.key);
      }
    }
    return WATER_BANDS.filter((b) => bucketsPresent.has(b.key)).map((b) => ({
      count: categoryScopedProducts.filter((p) => {
        if (p.waterResistanceM == null) return false;
        return p.waterResistanceM >= b.min && p.waterResistanceM < b.max;
      }).length,
      label: b.label,
      value: b.key,
    }));
  }, [categoryScopedProducts]);

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

  const toggleArray = (key: keyof typeof collectionSearchParams, value: string, current: string[]) => {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    void setQuery({ [key]: next, page: 1 } as unknown as Record<string, unknown>);
  };

  const toggleHouse = (house: string) => toggleArray("house", house, selectedHouses);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const activePriceBands = noMoneyMode
    ? []
    : PRICE_BANDS.filter((b) => selectedPriceKeys.includes(b.key));

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
      if (inStockFilter === "1" && !p.inStock) return false;

      if (!noMoneyMode && activePriceBands.length > 0) {
        const hit = activePriceBands.some((b) => p.price >= b.min && p.price < b.max);
        if (!hit) return false;
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
      if (selectedMovements.length > 0) {
        if (!p.movement || !selectedMovements.includes(p.movement)) return false;
      }
      if (selectedCaseMats.length > 0) {
        if (!p.caseMaterial || !selectedCaseMats.includes(p.caseMaterial)) return false;
      }
      if (selectedStraps.length > 0) {
        if (!p.strapMaterial || !selectedStraps.includes(p.strapMaterial)) return false;
      }
      if (selectedMetals.length > 0) {
        if (!p.metal || !selectedMetals.includes(p.metal)) return false;
      }
      if (selectedGems.length > 0) {
        if (!p.gemstone || !selectedGems.includes(p.gemstone)) return false;
      }
      if (selectedWaters.length > 0) {
        if (p.waterResistanceM == null) return false;
        const hit = selectedWaters.some((k) => {
          const b = WATER_BANDS.find((x) => x.key === k);
          if (!b) return false;
          return p.waterResistanceM! >= b.min && p.waterResistanceM! < b.max;
        });
        if (!hit) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (!noMoneyMode && sortBy === "price-asc")
      sorted.sort((a, b) => a.price - b.price);
    else if (!noMoneyMode && sortBy === "price-desc")
      sorted.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc")
      sorted.sort((a, b) => a.name.localeCompare(b.name));

    return sorted;
  }, [
    categoryScopedProducts,
    normalizedQuery,
    inStockFilter,
    activePriceBands,
    caseSizeRange,
    selectedHouses,
    selectedMovements,
    selectedCaseMats,
    selectedStraps,
    selectedMetals,
    selectedGems,
    selectedWaters,
    sortBy,
    noMoneyMode,
  ]);

  // Reset page when any filter changes (but not on first mount storm)
  const filterSignature = [
    resolvedCategoryId ?? "",
    normalizedQuery,
    selectedPriceKeys.join(","),
    selectedHouses.join(","),
    selectedMovements.join(","),
    selectedCaseMats.join(","),
    selectedStraps.join(","),
    selectedMetals.join(","),
    selectedGems.join(","),
    selectedWaters.join(","),
    inStockFilter,
    caseSizeRange?.join(",") ?? "",
  ].join("|");
  const prevSigRef = React.useRef(filterSignature);
  React.useEffect(() => {
    if (prevSigRef.current !== filterSignature) {
      prevSigRef.current = filterSignature;
      void setQuery({ page: 1 });
    }
  }, [filterSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = filteredProducts.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filteredProducts.length, currentPage * PAGE_SIZE);

  const isCaseSizeFiltered =
    !!caseSizeBounds &&
    !!caseSizeRange &&
    (caseSizeRange[0] !== caseSizeBounds[0] ||
      caseSizeRange[1] !== caseSizeBounds[1]);

  const hasActiveFilters =
    (!lockedCategoryId && selectedCategoryId !== null) ||
    normalizedQuery.length > 0 ||
    activePriceBands.length > 0 ||
    isCaseSizeFiltered ||
    selectedHouses.length > 0 ||
    selectedMovements.length > 0 ||
    selectedCaseMats.length > 0 ||
    selectedStraps.length > 0 ||
    selectedMetals.length > 0 ||
    selectedGems.length > 0 ||
    selectedWaters.length > 0 ||
    inStockFilter === "1";

  const resetFilters = () => {
    if (!lockedCategoryId) setSelectedCategoryId(null);
    if (caseSizeBounds) setCaseSizeRange(caseSizeBounds);
    void setQuery({
      caseMat: [],
      gem: [],
      house: [],
      inStock: "",
      metal: [],
      movement: [],
      page: 1,
      price: [],
      search: "",
      strap: [],
      water: [],
    });
  };

  const houseLabel = isJewelryContext ? "Type" : isWatchesContext ? "Maison" : "House";
  const showWatchFacets = !isJewelryContext;
  const showJewelryFacets = !isWatchesContext;

  const filterPanel = (
    <div className="divide-y divide-border">
      {!lockedCategoryId && (
        <FilterSection title="Category" defaultOpen>
          <ul className="space-y-2">
            <li>
              <button
                aria-pressed={selectedCategoryId === null}
                className={cn(
                  "flex w-full items-center justify-between text-sm transition-colors",
                  selectedCategoryId === null
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setSelectedCategoryId(null)}
                type="button"
              >
                <span>All Pieces</span>
                <span className="krs-meta text-[10px] text-muted-foreground">
                  {products.length}
                </span>
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  aria-pressed={selectedCategoryId === category.id}
                  className={cn(
                    "flex w-full items-center justify-between text-sm transition-colors",
                    selectedCategoryId === category.id
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setSelectedCategoryId(category.id)}
                  type="button"
                >
                  <span>{category.name}</span>
                  <span className="krs-meta text-[10px] text-muted-foreground">
                    {category.productCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      <FilterSection
        title={houseLabel}
        count={houseFacet.length}
        defaultOpen
      >
        {houseFacet.length === 0 ? (
          <p className="text-xs text-muted-foreground">No options</p>
        ) : (
          <FacetList
            options={houseFacet}
            selected={selectedHouses}
            onToggle={toggleHouse}
            idPrefix="house"
          />
        )}
      </FilterSection>

      <FilterSection title="Availability" defaultOpen>
        <label
          htmlFor="filter-instock"
          className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
        >
          <Checkbox
            id="filter-instock"
            checked={inStockFilter === "1"}
            onCheckedChange={(v) =>
              void setQuery({ inStock: v ? "1" : "", page: 1 })
            }
          />
          In stock only
          <span className="ml-auto krs-meta text-[10px] text-muted-foreground">
            {categoryScopedProducts.filter((p) => p.inStock).length}
          </span>
        </label>
      </FilterSection>

      {!noMoneyMode && (
        <FilterSection title="Price" defaultOpen>
          <ul className="space-y-2">
            {PRICE_BANDS.map((band) => (
              <li key={band.key}>
                <label
                  htmlFor={`price-${band.key}`}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    id={`price-${band.key}`}
                    checked={selectedPriceKeys.includes(band.key)}
                    onCheckedChange={() => toggleArray("price", band.key, selectedPriceKeys)}
                  />
                  <span className="flex-1">{band.label}</span>
                  <span className="krs-meta text-[10px] text-muted-foreground">
                    {
                      categoryScopedProducts.filter(
                        (p) => p.price >= band.min && p.price < band.max,
                      ).length
                    }
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* WATCH FACETS */}
      {showWatchFacets && movementFacet.length > 0 && (
        <FilterSection title="Movement" count={movementFacet.length}>
          <FacetList
            options={movementFacet}
            selected={selectedMovements}
            onToggle={(v) => toggleArray("movement", v, selectedMovements)}
            idPrefix="movement"
          />
        </FilterSection>
      )}
      {showWatchFacets && caseMatFacet.length > 0 && (
        <FilterSection title="Case Material" count={caseMatFacet.length}>
          <FacetList
            options={caseMatFacet}
            selected={selectedCaseMats}
            onToggle={(v) => toggleArray("caseMat", v, selectedCaseMats)}
            idPrefix="caseMat"
          />
        </FilterSection>
      )}
      {showWatchFacets && strapFacet.length > 0 && (
        <FilterSection title="Strap" count={strapFacet.length}>
          <FacetList
            options={strapFacet}
            selected={selectedStraps}
            onToggle={(v) => toggleArray("strap", v, selectedStraps)}
            idPrefix="strap"
          />
        </FilterSection>
      )}
      {showWatchFacets && waterFacet.length > 0 && (
        <FilterSection title="Water Resistance" count={waterFacet.length}>
          <ul className="space-y-2">
            {waterFacet.map((opt) => (
              <li key={opt.value}>
                <label
                  htmlFor={`water-${opt.value}`}
                  className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
                >
                  <Checkbox
                    id={`water-${opt.value}`}
                    checked={selectedWaters.includes(opt.value)}
                    onCheckedChange={() => toggleArray("water", opt.value, selectedWaters)}
                  />
                  <span className="flex-1">{opt.label}</span>
                  <span className="krs-meta text-[10px] text-muted-foreground">
                    {opt.count}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </FilterSection>
      )}

      {/* JEWELRY FACETS */}
      {showJewelryFacets && metalFacet.length > 0 && (
        <FilterSection title="Metal" count={metalFacet.length} defaultOpen={isJewelryContext}>
          <FacetList
            options={metalFacet}
            selected={selectedMetals}
            onToggle={(v) => toggleArray("metal", v, selectedMetals)}
            idPrefix="metal"
          />
        </FilterSection>
      )}
      {showJewelryFacets && gemFacet.length > 0 && (
        <FilterSection title="Gemstone" count={gemFacet.length} defaultOpen={isJewelryContext}>
          <FacetList
            options={gemFacet}
            selected={selectedGems}
            onToggle={(v) => toggleArray("gem", v, selectedGems)}
            idPrefix="gem"
          />
        </FilterSection>
      )}

      {caseSizeBounds && caseSizeRange && showWatchFacets && (
        <FilterSection title="Case Size" defaultOpen={false}>
          <div className="space-y-3">
            <Slider
              min={caseSizeBounds[0]}
              max={caseSizeBounds[1]}
              step={1}
              value={caseSizeRange}
              onValueChange={(v) => setCaseSizeRange(v as [number, number])}
            />
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-1.5">
                <Input
                  aria-label="Min case size"
                  className="h-8 rounded-none text-center text-xs"
                  type="number"
                  min={caseSizeBounds[0]}
                  max={caseSizeBounds[1]}
                  value={caseSizeRange[0]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n))
                      setCaseSizeRange([Math.max(caseSizeBounds[0], Math.min(n, caseSizeRange[1])), caseSizeRange[1]]);
                  }}
                />
                <span className="krs-meta text-[10px] text-muted-foreground">—</span>
                <Input
                  aria-label="Max case size"
                  className="h-8 rounded-none text-center text-xs"
                  type="number"
                  min={caseSizeBounds[0]}
                  max={caseSizeBounds[1]}
                  value={caseSizeRange[1]}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (!Number.isNaN(n))
                      setCaseSizeRange([caseSizeRange[0], Math.min(caseSizeBounds[1], Math.max(n, caseSizeRange[0]))]);
                  }}
                />
              </div>
              <span className="krs-meta shrink-0 text-[10px] text-muted-foreground">mm</span>
            </div>
            <p className="krs-meta text-center text-[10px] text-muted-foreground">
              {caseSizeRange[0]}mm – {caseSizeRange[1]}mm · {categoryScopedProducts.filter((p) => p.caseSizeMm != null && p.caseSizeMm >= caseSizeRange[0] && p.caseSizeMm <= caseSizeRange[1]).length} pieces
            </p>
          </div>
        </FilterSection>
      )}

      {hasActiveFilters && (
        <div className="pt-6">
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-krs-champagne hover:text-krs-champagne-light"
            onClick={resetFilters}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (!lockedCategoryId && selectedCategoryId) {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat) activeChips.push({ key: `cat-${cat.id}`, label: cat.name, onClear: () => setSelectedCategoryId(null) });
  }
  for (const h of selectedHouses) activeChips.push({ key: `house-${h}`, label: h, onClear: () => toggleHouse(h) });
  for (const k of selectedPriceKeys) {
    const b = PRICE_BANDS.find((x) => x.key === k);
    if (b && !noMoneyMode) activeChips.push({ key: `price-${k}`, label: b.label, onClear: () => toggleArray("price", k, selectedPriceKeys) });
  }
  for (const v of selectedMovements) activeChips.push({ key: `mov-${v}`, label: v, onClear: () => toggleArray("movement", v, selectedMovements) });
  for (const v of selectedCaseMats) activeChips.push({ key: `cmat-${v}`, label: v, onClear: () => toggleArray("caseMat", v, selectedCaseMats) });
  for (const v of selectedStraps) activeChips.push({ key: `strap-${v}`, label: v, onClear: () => toggleArray("strap", v, selectedStraps) });
  for (const v of selectedMetals) activeChips.push({ key: `metal-${v}`, label: v, onClear: () => toggleArray("metal", v, selectedMetals) });
  for (const v of selectedGems) activeChips.push({ key: `gem-${v}`, label: v, onClear: () => toggleArray("gem", v, selectedGems) });
  for (const v of selectedWaters) {
    const b = WATER_BANDS.find((x) => x.key === v);
    activeChips.push({ key: `water-${v}`, label: b?.label ? `${b.label} water` : v, onClear: () => toggleArray("water", v, selectedWaters) });
  }
  if (inStockFilter === "1") activeChips.push({ key: "instock", label: "In stock", onClear: () => void setQuery({ inStock: "", page: 1 }) });
  if (isCaseSizeFiltered && caseSizeRange) activeChips.push({ key: "case-size", label: `Case ${caseSizeRange[0]}–${caseSizeRange[1]}mm`, onClear: () => caseSizeBounds && setCaseSizeRange(caseSizeBounds) });

  const totalHouses = new Set(products.map((p) => p.subcategory?.name).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10 xl:gap-12 2xl:gap-16">
      <aside className="hidden w-[264px] shrink-0 lg:block xl:w-[280px] 2xl:w-[300px] lg:sticky lg:top-[calc(var(--header-height)+24px)] lg:max-h-[calc(100vh-var(--header-height)-48px)] lg:overflow-y-auto lg:pr-3 no-scrollbar lg:self-start">
        {filterPanel}
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[360px] sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search the collection"
                className="h-[42px] rounded-none pl-9 pr-9 text-sm"
                onChange={(e) => void setQuery({ page: 1, search: e.target.value })}
                placeholder="Name, house or reference"
                type="text"
                value={searchQuery}
              />
              {searchQuery && (
                <button
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => void setQuery({ page: 1, search: "" })}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-[42px] gap-1.5 rounded-none lg:hidden">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                        {activeChips.length}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88%] overflow-y-auto p-6 sm:max-w-[380px]">
                  <SheetTitle className="font-display text-lg">Filter</SheetTitle>
                  <p className="krs-meta mt-1 text-[10px] text-muted-foreground">
                    {filteredProducts.length} pieces · {totalHouses} houses
                  </p>
                  <div className="mt-6">{filterPanel}</div>
                  <SheetClose asChild>
                    <Button className="mt-8 w-full rounded-none">Show {filteredProducts.length} pieces</Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>

              <label className="relative flex items-center sm:w-auto">
                <select
                  aria-label="Sort products"
                  className="h-[42px] w-full appearance-none border border-input bg-transparent pl-3 pr-8 text-xs text-foreground focus-visible:outline-none focus-visible:border-primary sm:min-w-[200px]"
                  onChange={(e) => void setQuery({ page: 1, sort: e.target.value as SortOption })}
                  value={sortBy}
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sort · {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </label>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  className="krs-meta inline-flex items-center gap-1.5 border border-primary bg-background px-2.5 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
                >
                  {chip.label}
                  <X className="h-3 w-3 shrink-0" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="krs-meta px-2 py-1.5 text-[11px] text-krs-champagne hover:text-krs-champagne-light"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length === 0
              ? "No pieces"
              : filteredProducts.length === 1
                ? "1 piece"
                : `${filteredProducts.length} pieces`}
            {filteredProducts.length > 0 && (
              <span> · Showing {rangeStart}–{rangeEnd}</span>
            )}
          </p>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {activeChips.length > 0 ? `${activeChips.length} filters active` : ""}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-y-9 2xl:gap-x-8">
          {pagedProducts.map((product) => (
            <ProductCard key={product.id} product={toCardProduct(product)} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-10 border border-border bg-card px-6 py-12 text-center">
            <p className="font-display text-lg text-foreground">No pieces match</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Try widening the price range, clearing the {houseLabel.toLowerCase()} filter, or searching by reference number.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button variant="outline" className="rounded-none" onClick={resetFilters}>
                Clear filters
              </Button>
              <Button
                variant="ghost"
                className="rounded-none text-krs-champagne"
                onClick={() => void setQuery({ search: "" })}
              >
                Clear search
              </Button>
            </div>
          </div>
        )}

        {pageCount > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
            <Button
              variant="outline"
              className="h-[34px] rounded-none px-3 text-xs"
              disabled={currentPage <= 1}
              onClick={() => void setQuery({ page: currentPage - 1 })}
            >
              Prev
            </Button>
            {paginationRange(currentPage, pageCount).map((item, idx) =>
              item === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  aria-current={item === currentPage ? "page" : undefined}
                  className={cn(
                    "krs-meta flex h-[34px] min-w-[34px] items-center justify-center border px-2 text-xs transition-colors",
                    item === currentPage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary",
                  )}
                  onClick={() => void setQuery({ page: item as number })}
                  type="button"
                >
                  {item}
                </button>
              ),
            )}
            <Button
              variant="outline"
              className="h-[34px] rounded-none px-3 text-xs"
              disabled={currentPage >= pageCount}
              onClick={() => void setQuery({ page: currentPage + 1 })}
            >
              Next
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}

function FilterSection({
  title,
  children,
  count,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="py-6 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h3 className="krs-eyebrow text-krs-tobacco">
          {title} {count != null && <span className="ml-1 font-sans text-[10px] normal-case tracking-normal text-muted-foreground">({count})</span>}
        </h3>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

function FacetList({
  options,
  selected,
  onToggle,
  idPrefix,
}: {
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
  idPrefix: string;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? options : options.slice(0, FACET_COLLAPSED);
  return (
    <>
      <ul className="space-y-2">
        {visible.map((opt) => (
          <li key={opt.value}>
            <label
              htmlFor={`${idPrefix}-${opt.value}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                id={`${idPrefix}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onCheckedChange={() => onToggle(opt.value)}
              />
              <span className="min-w-0 flex-1 truncate">{opt.label}</span>
              <span className="krs-meta shrink-0 text-[10px] text-muted-foreground">{opt.count}</span>
            </label>
          </li>
        ))}
      </ul>
      {options.length > FACET_COLLAPSED && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="krs-meta mt-3 text-krs-champagne hover:text-krs-champagne-light"
        >
          {showAll ? "Show fewer" : `+ ${options.length - FACET_COLLAPSED} more`}
        </button>
      )}
    </>
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

function facetFrom(
  products: ProductWithRelations[],
  get: (p: ProductWithRelations) => null | string,
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const v = get(p);
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: value, count }));
}

function paginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const delta = 1;
  const range: (number | "...")[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push("...");
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push("...");
  range.push(total);
  return range;
}
