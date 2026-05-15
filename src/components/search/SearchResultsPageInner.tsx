"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Drawer } from "@/src/components/ui/Drawer";
import { Select } from "@/src/components/ui/Select";
import { Pagination } from "@/src/components/navigation/Pagination";
import { ProductCardList } from "@/src/components/product/ProductCardList";
import { toProductCardProps } from "@/src/types/storefront-product-card.types";
import { SearchFiltersPanel } from "./SearchFiltersPanel";
import { SearchEmptyState } from "./SearchEmptyState";
import {
  PRICE_MAX,
  PRICE_MIN,
  SORT_OPTIONS,
  type FilterDefinition,
  type FilterState,
  type FilterValue,
} from "@/src/app/(storefront)/products/_config";
import { buildSearchFilterDefinitions } from "@/src/app/(storefront)/search/_search_config";
import type { StorefrontBrand } from "@/src/services/storefront-catalog-meta.service";
import type {
  StorefrontSearchResults,
  StorefrontSearchSort,
} from "@/src/types/storefront-search.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

function isFilterActive(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return true;
  if (typeof value === "string") return value !== "";
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

interface ActiveChip {
  key: string;
  label: string;
  group: string;
}

function buildActiveFilters(
  state: FilterState,
  definitions: FilterDefinition[],
): ActiveChip[] {
  const chips: ActiveChip[] = [];
  for (const def of definitions) {
    const val = state[def.key];
    if (!isFilterActive(val)) continue;

    switch (def.type) {
      case "dropdown":
      case "checkbox": {
        const arr = Array.isArray(val) ? (val as string[]) : val ? [val as string] : [];
        for (const v of arr) {
          const opt = def.options?.find((o) => o.value === v);
          if (opt) chips.push({ key: `${def.key}:${v}`, label: opt.label, group: def.label });
        }
        break;
      }
      case "range": {
        const [min, max] = val as [number, number];
        const label =
          def.unit === "₫"
            ? `${formatVND(min)} – ${formatVND(max)}`
            : `${min} – ${max}${def.unit ? ` ${def.unit}` : ""}`;
        chips.push({ key: def.key, label, group: def.label });
        break;
      }
      case "toggle":
        chips.push({ key: def.key, label: def.label, group: "" });
        break;
      case "rating":
        chips.push({ key: def.key, label: `${val}★ trở lên`, group: def.label });
        break;
    }
  }
  return chips;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchInitialState {
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ratingMin?: number;
  sort: StorefrontSearchSort;
  page: number;
}

export interface SearchResultsPageInnerProps {
  results: StorefrontSearchResults;
  query: string;
  brands: StorefrontBrand[];
  initialState: SearchInitialState;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchResultsPageInner({
  results,
  query,
  brands,
  initialState,
}: SearchResultsPageInnerProps) {
  const router = useRouter();

  const filterDefinitions = useMemo(
    () => buildSearchFilterDefinitions(brands),
    [brands],
  );

  // Initialise filter state from URL-derived initialState.
  const initialFilterState = useMemo<FilterState>(() => {
    const state: FilterState = {};
    if (initialState.brandSlug) state.brand = [initialState.brandSlug];
    if (initialState.minPrice != null || initialState.maxPrice != null) {
      state.price = [
        initialState.minPrice ?? PRICE_MIN,
        initialState.maxPrice ?? PRICE_MAX,
      ];
    }
    if (initialState.inStock) state.inStock = true;
    if (initialState.ratingMin != null) state.rating = initialState.ratingMin;
    return state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // appliedFilters = committed to URL; draftFilters = what the panel shows
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilterState);
  const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilterState);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterHasChanges = useMemo(
    () => JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters),
    [draftFilters, appliedFilters],
  );

  // Build URL params from filter state + sort + page and push to router.
  const pushUrl = useCallback(
    (overrides: {
      filters?: FilterState;
      sort?: StorefrontSearchSort;
      page?: number;
      q?: string;
      categorySlug?: string;
    }) => {
      const nextFilters = overrides.filters ?? appliedFilters;
      const nextSort = overrides.sort ?? initialState.sort;
      const nextPage = overrides.page ?? 1;
      const nextQuery = overrides.q ?? query;
      const nextCategorySlug = overrides.categorySlug ?? initialState.categorySlug;

      const sp = new URLSearchParams();
      if (nextQuery) sp.set("q", nextQuery);
      if (nextCategorySlug) sp.set("category", nextCategorySlug);

      const brandSlugs = nextFilters.brand as string[] | undefined;
      if (brandSlugs && brandSlugs.length > 0) sp.set("brand", brandSlugs[0]);

      const price = nextFilters.price as [number, number] | undefined;
      if (price && (price[0] !== PRICE_MIN || price[1] !== PRICE_MAX)) {
        sp.set("minPrice", String(price[0]));
        sp.set("maxPrice", String(price[1]));
      }
      if (nextFilters.inStock === true) sp.set("inStock", "1");
      if (typeof nextFilters.rating === "number") {
        sp.set("rating", String(nextFilters.rating));
      }
      if (nextSort !== "bestselling") sp.set("sort", nextSort);
      if (nextPage > 1) sp.set("page", String(nextPage));

      router.replace(`/search?${sp.toString()}`, { scroll: false });
    },
    [appliedFilters, initialState.sort, initialState.categorySlug, query, router],
  );

  function applyFilters(next: FilterState) {
    setAppliedFilters(next);
    setDraftFilters(next);
    pushUrl({ filters: next, page: 1 });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleApply() {
    applyFilters(draftFilters);
  }

  function handleSortChange(value: string | string[]) {
    const next = (typeof value === "string" ? value : value[0]) as StorefrontSearchSort;
    pushUrl({ sort: next, page: 1 });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function removeChip(chipKey: string) {
    const [filterKey, optionValue] = chipKey.split(":");
    const next: FilterState = { ...appliedFilters };
    if (optionValue !== undefined) {
      const arr = (next[filterKey] as string[]) ?? [];
      const filtered = arr.filter((v) => v !== optionValue);
      if (filtered.length === 0) {
        delete next[filterKey];
      } else {
        next[filterKey] = filtered;
      }
    } else {
      delete next[filterKey];
    }
    applyFilters(next);
  }

  function handlePageChange(nextPage: number) {
    pushUrl({ page: nextPage });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const handleNewSearch = useCallback(
    (q: string) => {
      router.replace(`/search?q=${encodeURIComponent(q)}`);
    },
    [router],
  );

  const activeChips = useMemo(
    () => buildActiveFilters(appliedFilters, filterDefinitions),
    [appliedFilters, filterDefinitions],
  );

  const productCards = useMemo(
    () => results.products.map(toProductCardProps),
    [results.products],
  );

  const hasNonProductResults =
    results.relatedCategories.length > 0 || results.relatedBrands.length > 0;
  const isEmpty = results.total === 0;

  return (
    <>
      {/* ── Zone 1: Search Hero ─────────────────────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          {!isEmpty && (
            <p className="mt-3 text-center text-sm text-secondary-500">
              Tìm thấy{" "}
              <strong className="font-semibold text-secondary-900">
                {results.total} kết quả
              </strong>{" "}
              cho{" "}
              <strong className="font-semibold text-secondary-900">
                &ldquo;{query}&rdquo;
              </strong>
            </p>
          )}
        </div>
      </section>

      {/* ── Zone 2: Category + Brand chips ─────────────────────────────── */}
      {hasNonProductResults && !isEmpty && (
        <section className="bg-secondary-50 border-b border-secondary-200 py-5">
          <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div
              className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin"
              aria-label="Danh mục và thương hiệu liên quan"
            >
              {results.relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${encodeURIComponent(cat.slug)}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-secondary-200 bg-white px-3 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  {cat.iconUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cat.iconUrl}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <span>{cat.name}</span>
                </Link>
              ))}

              {results.relatedBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/search?q=${encodeURIComponent(query)}&brand=${encodeURIComponent(brand.slug)}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-secondary-200 bg-white px-3 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  {brand.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={brand.logoUrl}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700"
                    >
                      {brand.name[0]}
                    </span>
                  )}
                  <span>{brand.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Zone 3: Filters + Product Results ──────────────────────────── */}
      <section className="py-8">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* Sidebar — always visible so users can adjust filters even when empty */}
            <aside className="hidden lg:block" aria-label="Bộ lọc">
              <div className="sticky top-24 rounded-xl border border-secondary-200 bg-white p-4">
                <SearchFiltersPanel
                  definitions={filterDefinitions}
                  value={draftFilters}
                  onChange={setDraftFilters}
                  onApply={handleApply}
                  hasChanges={filterHasChanges}
                />
              </div>
            </aside>

            <div className="min-w-0">
              {/* Toolbar: mobile filter button + active chips + sort */}
              <div className="mb-5 flex flex-wrap items-start gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FunnelIcon />}
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden shrink-0"
                >
                  Lọc
                </Button>

                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {activeChips.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                    >
                      {chip.group && (
                        <span className="text-primary-500">{chip.group}:</span>
                      )}
                      {chip.label}
                      <button
                        type="button"
                        aria-label={`Xóa bộ lọc ${chip.label}`}
                        onClick={() => removeChip(chip.key)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-primary-200 transition-colors"
                      >
                        <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}

                  {activeChips.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyFilters({})}
                      className="text-xs text-secondary-500 hover:text-secondary-700 transition-colors underline underline-offset-2"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  )}
                </div>

                {!isEmpty && (
                  <div className="ml-auto w-44 shrink-0">
                    <Select
                      options={SORT_OPTIONS}
                      value={[initialState.sort]}
                      onChange={handleSortChange}
                      size="sm"
                      placeholder="Sắp xếp"
                    />
                  </div>
                )}
              </div>

              {isEmpty ? (
                <SearchEmptyState
                  query={query}
                  onSearch={handleNewSearch}
                  relatedCategories={results.relatedCategories}
                  relatedBrands={results.relatedBrands}
                  hasActiveFilters={Object.keys(appliedFilters).length > 0}
                  onClearFilters={() => applyFilters({})}
                  topBrands={brands.slice(0, 8)}
                />
              ) : (
                <>
                  <ProductCardList products={productCards} itemsPerRow={6} />

                  {results.totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination
                        page={results.page}
                        totalPages={results.totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Drawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        position="left"
        size="md"
        title="Bộ lọc tìm kiếm"
      >
        <div className="p-4">
          <SearchFiltersPanel
            definitions={filterDefinitions}
            value={draftFilters}
            onChange={setDraftFilters}
            onApply={() => {
              handleApply();
              setMobileFiltersOpen(false);
            }}
            hasChanges={filterHasChanges}
          />
        </div>
      </Drawer>
    </>
  );
}
