"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

import { Badge, Button, Drawer, Select } from "@/src/components/ui";
import { Breadcrumb, Pagination } from "@/src/components/navigation";
import {
  ProductCardList,
  CompareBar,
  type CompareProduct,
} from "@/src/components/product";
import {
  toProductCardProps,
  type StorefrontProductCardDto,
} from "@/src/types/storefront-product-card.types";
import {
  getProductList,
  type ProductListResult,
  type ProductSort,
} from "@/src/services/storefront-product-list.service";
import type {
  StorefrontBrand,
  StorefrontCategoryDetail,
  StorefrontCategoryNode,
  StorefrontFacetGroup,
  StorefrontFacetType,
} from "@/src/services/storefront-catalog-meta.service";

import {
  buildCategoryFilterDefinitions,
  PRICE_MAX,
  PRICE_MIN,
  SORT_OPTIONS,
  type FilterState,
  type FilterValue,
} from "./_config";
import {
  ActiveFiltersPanel,
  BrandRailVisualization,
  buildActiveFilters,
  EmptyState,
  HorizontalFilterBar,
  MobileFilterContent,
} from "@/src/app/(storefront)/products/_components";

const PAGE_SIZE = 12;
const ITEMS_PER_ROW = 6 as const;

interface Props {
  category: StorefrontCategoryDetail;
  brands: StorefrontBrand[];
  categoryTree: StorefrontCategoryNode[];
  facets?: StorefrontFacetGroup[];
}

function flattenFacetTypes(
  facets: StorefrontFacetGroup[],
): Map<string, StorefrontFacetType> {
  const m = new Map<string, StorefrontFacetType>();
  for (const g of facets) for (const t of g.types) m.set(t.key, t);
  return m;
}

function parseFilterStateFromUrl(
  sp: URLSearchParams,
  brands: StorefrontBrand[],
  facetTypeMap: Map<string, StorefrontFacetType>,
): FilterState {
  const state: FilterState = {};

  const brandSlugs = sp.getAll("brand");
  if (brandSlugs.length > 0) {
    const known = new Set(brands.map((b) => b.slug));
    const valid = brandSlugs.filter((s) => known.has(s));
    if (valid.length > 0) state.brand = valid;
  }

  const minPrice = sp.get("minPrice") ?? sp.get("price_min");
  const maxPrice = sp.get("maxPrice") ?? sp.get("price_max");
  if (minPrice != null || maxPrice != null) {
    const lo = minPrice != null ? Number(minPrice) : PRICE_MIN;
    const hi = maxPrice != null ? Number(maxPrice) : PRICE_MAX;
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
      state.price = [lo, hi];
    }
  }

  if (sp.get("inStock") === "1") state.inStock = true;
  // Accept both ?onSale=1 (new) and legacy ?discount=1 for back-compat.
  if (sp.get("onSale") === "1" || sp.get("discount") === "1") state.onSale = true;

  const rating = sp.get("rating");
  if (rating) {
    const n = Number(rating);
    if (Number.isFinite(n) && n >= 1 && n <= 5) state.rating = n;
  }

  // ── Dynamic facet keys (spec_<typeId>) ──
  for (const [key, rawValue] of sp.entries()) {
    if (!key.startsWith("spec_")) continue;
    const facet = facetTypeMap.get(key);
    if (!facet) continue;
    const widget = facet.widget;

    if (widget === "toggle") {
      if (rawValue === "true" || rawValue === "1") state[key] = true;
      continue;
    }
    if (widget === "range") {
      const m = rawValue.match(/^(-?\d+(?:\.\d+)?)\.\.(-?\d+(?:\.\d+)?)$/);
      if (m) {
        const lo = Number(m[1]);
        const hi = Number(m[2]);
        if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
          state[key] = [lo, hi];
        }
      }
      continue;
    }
    if (widget === "select") {
      if (rawValue) state[key] = rawValue;
      continue;
    }
    // checkbox
    const values = sp.getAll(key).flatMap((v) => v.split(","));
    const cleaned = values.map((v) => v.trim()).filter(Boolean);
    if (cleaned.length) state[key] = Array.from(new Set(cleaned));
  }

  return state;
}

function buildUrlSearch(
  filters: FilterState,
  q: string,
  sort: ProductSort,
  page: number,
  facetTypeMap: Map<string, StorefrontFacetType>,
): string {
  const sp = new URLSearchParams();
  if (q) sp.set("q", q);

  const brandSlugs = filters.brand as string[] | undefined;
  if (brandSlugs?.length) brandSlugs.forEach((b) => sp.append("brand", b));

  const price = filters.price as [number, number] | undefined;
  if (price && (price[0] !== PRICE_MIN || price[1] !== PRICE_MAX)) {
    sp.set("minPrice", String(price[0]));
    sp.set("maxPrice", String(price[1]));
  }
  if (filters.inStock === true) sp.set("inStock", "1");
  if (filters.onSale === true) sp.set("onSale", "1");
  if (typeof filters.rating === "number") sp.set("rating", String(filters.rating));

  // ── Dynamic facets ──
  for (const [key, value] of Object.entries(filters)) {
    if (!key.startsWith("spec_")) continue;
    const facet = facetTypeMap.get(key);
    if (!facet) continue;
    if (facet.widget === "toggle") {
      if (value === true) sp.set(key, "true");
      continue;
    }
    if (facet.widget === "range") {
      const r = value as [number, number] | undefined;
      if (!r) continue;
      const [lo, hi] = r;
      if (facet.min != null && facet.max != null && lo === facet.min && hi === facet.max) {
        continue;
      }
      sp.set(key, `${lo}..${hi}`);
      continue;
    }
    if (facet.widget === "select") {
      if (typeof value === "string" && value) sp.set(key, value);
      continue;
    }
    // checkbox
    const arr = value as string[] | undefined;
    if (arr?.length) sp.set(key, arr.join(","));
  }

  if (sort !== "bestselling") sp.set("sort", sort);
  if (page > 1) sp.set("page", String(page));

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function CategoryCatalogClient({
  category,
  brands,
  categoryTree,
  facets = [],
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterDefinitions = useMemo(
    () => buildCategoryFilterDefinitions(brands, facets),
    [brands, facets],
  );

  const facetTypeMap = useMemo(() => flattenFacetTypes(facets), [facets]);

  // ── Initialize state from URL ──
  // `filters` = committed state (drives URL + fetch).
  // `draftFilters` = uncommitted state bound to the filter inputs; only
  // promoted to `filters` when the user presses the apply button. This
  // prevents every slider tick / toggle click from firing a backend query.
  const initialState = useMemo(
    () =>
      parseFilterStateFromUrl(
        new URLSearchParams(searchParams.toString()),
        brands,
        facetTypeMap,
      ),
    // Recomputing when searchParams change would clobber draft edits — intentionally
    // run only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [filters, setFilters] = useState<FilterState>(initialState);
  const [draftFilters, setDraftFilters] = useState<FilterState>(initialState);
  const [q, setQ] = useState<string>(() => searchParams.get("q") ?? "");
  const [sort, setSort] = useState<ProductSort>(
    () => (searchParams.get("sort") as ProductSort | null) ?? "bestselling",
  );
  const [page, setPage] = useState<number>(
    () => Number(searchParams.get("page") ?? "1") || 1,
  );

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [result, setResult] = useState<ProductListResult>({
    items: [],
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [compareList, setCompareList] = useState<CompareProduct[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // ── Derived: parent category (from tree) for breadcrumb ──
  const parentCategory = useMemo(() => {
    if (category.parentId == null) return null;
    const walk = (nodes: StorefrontCategoryNode[]): StorefrontCategoryNode | null => {
      for (const n of nodes) {
        if (n.id === category.parentId) return n;
        const hit = n.children?.length ? walk(n.children) : null;
        if (hit) return hit;
      }
      return null;
    };
    return walk(categoryTree);
  }, [category.parentId, categoryTree]);

  // ── Derived: active single brand (for hiding BrandRail) ──
  const activeBrand = useMemo(() => {
    const slugs = (filters.brand as string[] | undefined) ?? [];
    if (slugs.length !== 1) return null;
    return brands.find((b) => b.slug === slugs[0]) ?? null;
  }, [filters.brand, brands]);

  // ── Sync state → URL ──
  useEffect(() => {
    const target = `/categories/${encodeURIComponent(category.slug)}${buildUrlSearch(filters, q, sort, page, facetTypeMap)}`;
    if (typeof window !== "undefined") {
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== target) router.replace(target, { scroll: false });
    }
  }, [filters, q, sort, page, router, category.slug, facetTypeMap]);

  // ── Fetch products (no-flash pattern for page-only changes) ──
  const prevNonPageKey = useRef("");
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(q);

  useEffect(() => {
    const brandSlugs = (filters.brand as string[] | undefined) ?? [];
    const brandId =
      brandSlugs.length === 1
        ? brands.find((b) => b.slug === brandSlugs[0])?.id
        : undefined;

    const price = filters.price as [number, number] | undefined;
    const minPrice = price && price[0] !== PRICE_MIN ? price[0] : undefined;
    const maxPrice = price && price[1] !== PRICE_MAX ? price[1] : undefined;

    const specsParams: string[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (!key.startsWith("spec_")) continue;
      const facet = facetTypeMap.get(key);
      if (!facet) continue;
      const typeId = facet.specTypeId;
      if (facet.widget === "toggle") {
        if (value === true) specsParams.push(`${typeId}:true`);
        continue;
      }
      if (facet.widget === "range") {
        const r = value as [number, number] | undefined;
        if (!r) continue;
        const [lo, hi] = r;
        if (facet.min != null && facet.max != null && lo === facet.min && hi === facet.max) {
          continue;
        }
        specsParams.push(`${typeId}:${lo}..${hi}`);
        continue;
      }
      if (facet.widget === "select") {
        if (typeof value === "string" && value) {
          specsParams.push(`${typeId}:${value}`);
        }
        continue;
      }
      const arr = value as string[] | undefined;
      if (arr?.length) specsParams.push(`${typeId}:${arr.join(",")}`);
    }

    const nonPageKey = JSON.stringify({ filters, q, sort });
    const isPageOnly =
      !isFirstRender.current && nonPageKey === prevNonPageKey.current;
    prevNonPageKey.current = nonPageKey;
    const isSearchChange = q !== prevSearchRef.current;
    prevSearchRef.current = q;
    const wasFirstRender = isFirstRender.current;
    isFirstRender.current = false;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(
      async () => {
        if (!isPageOnly) setLoading(true);
        try {
          const data = await getProductList({
            q: q || undefined,
            categoryId: category.id,
            brandId,
            minPrice,
            maxPrice,
            inStock: filters.inStock === true ? true : undefined,
            onSale: filters.onSale === true ? true : undefined,
            ratingMin:
              typeof filters.rating === "number" ? filters.rating : undefined,
            sort,
            page,
            limit: PAGE_SIZE,
            specs: specsParams.length ? specsParams : undefined,
          });

          // Client-side post-filter for fields BE doesn't support directly
          let items: StorefrontProductCardDto[] = data.items;
          // BE only takes single brandId — fallback filter for multi
          if (brandSlugs.length > 1) {
            const brandSet = new Set(
              brandSlugs
                .map((s) => brands.find((b) => b.slug === s)?.name)
                .filter(Boolean) as string[],
            );
            items = items.filter((p) => brandSet.has(p.brand));
          }

          setResult({ ...data, items });
        } catch (err) {
          console.error("[/categories] fetch failed", err);
          if (wasFirstRender) {
            setResult({
              items: [],
              total: 0,
              page: 1,
              limit: PAGE_SIZE,
              totalPages: 0,
            });
          }
        } finally {
          setLoading(false);
        }
      },
      isSearchChange ? 300 : 0,
    );

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [filters, q, sort, page, brands, category.id, facetTypeMap]);

  // ── Reset page when filters/sort/q change ──
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, q, sort]);

  // ── Handlers ──
  // Filter inputs write only to the draft; pressing the apply button
  // promotes the draft into `filters` (which actually triggers fetch).
  const handleFilterChange = useCallback(
    (key: string, value: FilterValue | undefined) => {
      setDraftFilters((prev) => {
        const next = { ...prev };
        if (value === undefined) delete next[key];
        else next[key] = value;
        return next;
      });
    },
    [],
  );

  const handleApplyFilters = useCallback(() => {
    setFilters(draftFilters);
  }, [draftFilters]);

  const handleResetDraft = useCallback(() => {
    setDraftFilters(filters);
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setDraftFilters({});
    setFilters({});
  }, []);

  // Removing a chip / committing a brand-rail click is an explicit user
  // intent — apply immediately (mirror change to both draft + committed).
  const mutateBothFilters = useCallback(
    (mutate: (prev: FilterState) => FilterState) => {
      setDraftFilters((prev) => mutate(prev));
      setFilters((prev) => mutate(prev));
    },
    [],
  );

  const handleRemoveChip = useCallback(
    (chipKey: string) => {
      const [filterKey, optionValue] = chipKey.split(":");
      mutateBothFilters((prev) => {
        const next = { ...prev };
        if (optionValue) {
          const arr = (prev[filterKey] as string[]) ?? [];
          const filtered = arr.filter((v) => v !== optionValue);
          if (filtered.length > 0) next[filterKey] = filtered;
          else delete next[filterKey];
        } else {
          delete next[filterKey];
        }
        return next;
      });
    },
    [mutateBothFilters],
  );

  const isFilterDirty = useMemo(
    () => JSON.stringify(draftFilters) !== JSON.stringify(filters),
    [draftFilters, filters],
  );

  const handleCompare = useCallback(
    (id: string) => {
      setCompareList((prev) => {
        if (prev.some((p) => p.id === id)) return prev.filter((p) => p.id !== id);
        if (prev.length >= 3) return prev;
        const product = result.items.find((p) => p.id === id);
        if (!product) return prev;
        return [
          ...prev,
          {
            id,
            name: product.name,
            thumbnail: product.thumbnail,
            price: product.price,
          },
        ];
      });
    },
    [result.items],
  );

  const activeFilterChips = useMemo(
    () => buildActiveFilters(filters, filterDefinitions),
    [filters, filterDefinitions],
  );

  // ── Breadcrumb ──
  const breadcrumbItems = useMemo(() => {
    const items: Array<{ label: string; href?: string }> = [
      { label: "Sản phẩm", href: "/products" },
    ];
    if (parentCategory) {
      items.push({
        label: parentCategory.name,
        href: `/categories/${parentCategory.slug}`,
      });
    }
    items.push({ label: category.name });
    return items;
  }, [parentCategory, category.name]);

  const subCategories = category.children ?? [];
  const showBrandRail = brands.length > 0;

  return (
    <>
      <div className="py-6 space-y-5 max-w-[1400px] mx-auto flex flex-col">
        <Breadcrumb showHome items={breadcrumbItems} />

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-secondary-900">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-sm text-secondary-500 max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {subCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {subCategories.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-secondary-200 bg-white px-3.5 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
              >
                <span>{child.name}</span>
                {typeof child.productCount === "number" && (
                  <span className="text-xs text-secondary-400">
                    ({child.productCount})
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {showBrandRail && (
          <BrandRailVisualization
            brands={brands}
            selected={(draftFilters.brand as string[] | undefined) ?? []}
            onToggle={(slug) =>
              mutateBothFilters((prev) => {
                const current = (prev.brand as string[] | undefined) ?? [];
                const next = current.includes(slug)
                  ? current.filter((s) => s !== slug)
                  : [...current, slug];
                return { ...prev, brand: next };
              })
            }
          />
        )}

        <div className="hidden lg:block">
          <HorizontalFilterBar
            definitions={filterDefinitions}
            filters={draftFilters}
            onChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleResetDraft}
            isDirty={isFilterDirty}
          />
        </div>

        <ActiveFiltersPanel
          chips={activeFilterChips}
          onRemove={handleRemoveChip}
          onClearAll={handleClearFilters}
        />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1.5" />
              Bộ lọc
              {activeFilterChips.length > 0 && (
                <Badge variant="primary" size="sm" className="ml-1.5">
                  {activeFilterChips.length}
                </Badge>
              )}
            </Button>

            <span className="text-sm text-secondary-500">
              <span className="font-semibold text-secondary-800">
                {result.total}
              </span>{" "}
              sản phẩm
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-44">
              <Select
                options={SORT_OPTIONS}
                value={sort}
                onChange={(v) => setSort(v as ProductSort)}
                size="sm"
                placeholder="Sắp xếp"
              />
            </div>

            <div className="hidden sm:flex items-center border border-secondary-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={[
                  "flex items-center justify-center w-9 h-9 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary-50 text-primary-600"
                    : "text-secondary-400 hover:text-secondary-600",
                ].join(" ")}
                aria-label="Xem dạng lưới"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={[
                  "flex items-center justify-center w-9 h-9 border-l border-secondary-200 transition-colors",
                  viewMode === "list"
                    ? "bg-primary-50 text-primary-600"
                    : "text-secondary-400 hover:text-secondary-600",
                ].join(" ")}
                aria-label="Xem dạng danh sách"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          {loading ? (
            <div className="py-20 text-center text-sm text-secondary-500">
              Đang tải sản phẩm...
            </div>
          ) : result.items.length === 0 ? (
            <EmptyState onClear={handleClearFilters} />
          ) : (
            <ProductCardList
              products={result.items.map((p) => ({
                ...toProductCardProps(p),
              }))}
              viewMode={viewMode}
              itemsPerRow={ITEMS_PER_ROW}
              onCompare={handleCompare}
            />
          )}

          {result.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                page={page}
                totalPages={result.totalPages}
                onPageChange={setPage}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </div>
      </div>

      <Drawer
        isOpen={mobileFilterOpen}
        onClose={() => {
          handleResetDraft();
          setMobileFilterOpen(false);
        }}
        position="left"
        size="lg"
        title="Bộ lọc sản phẩm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handleClearFilters();
                setMobileFilterOpen(false);
              }}
            >
              Xoá tất cả
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                handleApplyFilters();
                setMobileFilterOpen(false);
              }}
            >
              {isFilterDirty ? "Áp dụng bộ lọc" : `Xem ${result.total} sản phẩm`}
            </Button>
          </div>
        }
      >
        <MobileFilterContent
          definitions={filterDefinitions}
          filters={draftFilters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </Drawer>

      <CompareBar
        products={compareList}
        onRemove={(id) =>
          setCompareList((prev) => prev.filter((p) => p.id !== id))
        }
        onCompare={() => {
          /* navigate to compare page */
        }}
        isOpen={compareList.length > 0}
      />
    </>
  );
}
