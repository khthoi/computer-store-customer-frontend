"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  findCategoryBySlug,
  getCategoryFacets,
  type StorefrontBrand,
  type StorefrontCategoryNode,
  type StorefrontFacetGroup,
  type StorefrontFacetType,
} from "@/src/services/storefront-catalog-meta.service";

import {
  buildCatalogFilterDefinitions,
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
} from "./_components";

const PAGE_SIZE = 12;
const ITEMS_PER_ROW = 6 as const;

interface Props {
  brands: StorefrontBrand[];
  categoryTree: StorefrontCategoryNode[];
}

function flattenFacetTypes(
  facets: StorefrontFacetGroup[],
): Map<string, StorefrontFacetType> {
  const map = new Map<string, StorefrontFacetType>();
  for (const group of facets) {
    for (const type of group.types) {
      map.set(type.key, type);
    }
  }
  return map;
}

function parseFilterStateFromUrl(
  sp: URLSearchParams,
  brands: StorefrontBrand[],
  categories: StorefrontCategoryNode[],
  facetTypeMap: Map<string, StorefrontFacetType> = new Map(),
): FilterState {
  const state: FilterState = {};

  const categorySlugs = sp.getAll("category");
  if (categorySlugs.length > 0) {
    // Validate against known categories
    const known = new Set(
      [
        ...categories.flatMap((c) => [c.slug, ...c.children.map((x) => x.slug)]),
      ].filter(Boolean),
    );
    const valid = categorySlugs.filter((s) => known.has(s));
    if (valid.length > 0) state.category = valid;
  }

  const brandSlugs = sp.getAll("brand");
  if (brandSlugs.length > 0) {
    const known = new Set(brands.map((b) => b.slug));
    const valid = brandSlugs.filter((s) => known.has(s));
    if (valid.length > 0) state.brand = valid;
  }

  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  if (minPrice != null && maxPrice != null) {
    const lo = Number(minPrice);
    const hi = Number(maxPrice);
    if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
      state.price = [lo, hi];
    }
  }

  if (sp.get("inStock") === "1") state.inStock = true;
  if (sp.get("onSale") === "1" || sp.get("discount") === "1") state.onSale = true;

  const rating = sp.get("rating");
  if (rating) {
    const n = Number(rating);
    if (Number.isFinite(n) && n >= 1 && n <= 5) state.rating = n;
  }

  for (const [key, rawValue] of sp.entries()) {
    if (!key.startsWith("spec_")) continue;
    const facet = facetTypeMap.get(key);
    if (!facet) continue;

    if (facet.widget === "toggle") {
      if (rawValue === "true" || rawValue === "1") state[key] = true;
      continue;
    }

    if (facet.widget === "range") {
      const match = rawValue.match(/^(-?\d+(?:\.\d+)?)\.\.(-?\d+(?:\.\d+)?)$/);
      if (match) {
        const lo = Number(match[1]);
        const hi = Number(match[2]);
        if (Number.isFinite(lo) && Number.isFinite(hi) && hi >= lo) {
          state[key] = [lo, hi];
        }
      }
      continue;
    }

    if (facet.widget === "select") {
      if (rawValue) state[key] = rawValue;
      continue;
    }

    const values = sp.getAll(key).flatMap((value) => value.split(","));
    const cleaned = values.map((value) => value.trim()).filter(Boolean);
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

  const categories = filters.category as string[] | undefined;
  if (categories?.length) categories.forEach((c) => sp.append("category", c));

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

  for (const [key, value] of Object.entries(filters)) {
    if (!key.startsWith("spec_")) continue;
    const facet = facetTypeMap.get(key);
    if (!facet) continue;

    if (facet.widget === "toggle") {
      if (value === true) sp.set(key, "true");
      continue;
    }

    if (facet.widget === "range") {
      const range = value as [number, number] | undefined;
      if (!range) continue;
      const [lo, hi] = range;
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

    const values = value as string[] | undefined;
    if (values?.length) sp.set(key, values.join(","));
  }

  if (sort !== "bestselling") sp.set("sort", sort);
  if (page > 1) sp.set("page", String(page));

  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function ProductsCatalogClient({ brands, categoryTree }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [facets, setFacets] = useState<StorefrontFacetGroup[]>([]);

  const facetTypeMap = useMemo(() => flattenFacetTypes(facets), [facets]);

  const [filters, setFilters] = useState<FilterState>(() =>
    parseFilterStateFromUrl(
      new URLSearchParams(searchParams.toString()),
      brands,
      categoryTree,
    ),
  );
  const [q] = useState<string>(() => searchParams.get("q") ?? "");
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

  // ── Derived: active category (single) for breadcrumb/title ──
  const activeCategory = useMemo(() => {
    const slugs = (filters.category as string[] | undefined) ?? [];
    if (slugs.length !== 1) return null;
    return findCategoryBySlug(categoryTree, slugs[0]);
  }, [filters.category, categoryTree]);

  const activeBrand = useMemo(() => {
    const slugs = (filters.brand as string[] | undefined) ?? [];
    if (slugs.length !== 1) return null;
    return brands.find((b) => b.slug === slugs[0]) ?? null;
  }, [filters.brand, brands]);

  const filterDefinitions = useMemo(
    () => buildCatalogFilterDefinitions(brands, categoryTree, facets),
    [brands, categoryTree, facets],
  );

  useEffect(() => {
    if (!activeCategory) {
      setFacets([]);
      setFilters((prev) => {
        const next = Object.fromEntries(
          Object.entries(prev).filter(([key]) => !key.startsWith("spec_")),
        );
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
      return;
    }

    let isCancelled = false;

    getCategoryFacets(activeCategory.slug)
      .then((data) => {
        if (isCancelled) return;
        setFacets(data);
        const nextFacetTypeMap = flattenFacetTypes(data);
        setFilters((prev) => {
          const staticFilters = Object.fromEntries(
            Object.entries(prev).filter(([key]) => !key.startsWith("spec_")),
          );
          const parsedSpecFilters = parseFilterStateFromUrl(
            new URLSearchParams(searchParams.toString()),
            brands,
            categoryTree,
            nextFacetTypeMap,
          );
          const next = {
            ...staticFilters,
            ...Object.fromEntries(
              Object.entries(parsedSpecFilters).filter(([key]) => key.startsWith("spec_")),
            ),
          };
          return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
        });
      })
      .catch(() => {
        if (isCancelled) return;
        setFacets([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeCategory, brands, categoryTree, searchParams]);

  // ── Sync state → URL ──
  useEffect(() => {
    const target = `/products${buildUrlSearch(filters, q, sort, page, facetTypeMap)}`;
    if (typeof window !== "undefined") {
      const current = `${window.location.pathname}${window.location.search}`;
      if (current !== target) router.replace(target, { scroll: false });
    }
  }, [filters, q, sort, page, router, facetTypeMap]);

  // ── Fetch products (no-flash pattern for page-only changes) ──
  const prevNonPageKey = useRef("");
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(q);

  useEffect(() => {
    const categorySlugs = (filters.category as string[] | undefined) ?? [];
    const brandSlugs = (filters.brand as string[] | undefined) ?? [];
    const categoryId =
      categorySlugs.length === 1
        ? findCategoryBySlug(categoryTree, categorySlugs[0])?.id
        : undefined;
    const brandId =
      brandSlugs.length === 1
        ? brands.find((b) => b.slug === brandSlugs[0])?.id
        : undefined;

    const price = filters.price as [number, number] | undefined;
    const minPrice =
      price && price[0] !== PRICE_MIN ? price[0] : undefined;
    const maxPrice =
      price && price[1] !== PRICE_MAX ? price[1] : undefined;
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
        const range = value as [number, number] | undefined;
        if (!range) continue;
        const [lo, hi] = range;
        if (facet.min != null && facet.max != null && lo === facet.min && hi === facet.max) {
          continue;
        }
        specsParams.push(`${typeId}:${lo}..${hi}`);
        continue;
      }

      if (facet.widget === "select") {
        if (typeof value === "string" && value) specsParams.push(`${typeId}:${value}`);
        continue;
      }

      const values = value as string[] | undefined;
      if (values?.length) specsParams.push(`${typeId}:${values.join(",")}`);
    }

    const nonPageKey = JSON.stringify({
      filters,
      q,
      sort,
    });
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
            categoryId,
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

          // Client-side post-filter for fields BE doesn't yet support
          let items: StorefrontProductCardDto[] = data.items;
          // If single-category selected via slug→id worked, BE already filtered.
          // For multi-select category/brand, BE only takes single id — fallback filter here.
          if (categorySlugs.length > 1) {
            // We don't have category slug on the card DTO; rely on BE for multi (omitted for v1).
          }
          if (brandSlugs.length > 1) {
            const brandSet = new Set(
              brandSlugs.map((s) => brands.find((b) => b.slug === s)?.name).filter(Boolean) as string[],
            );
            items = items.filter((p) => brandSet.has(p.brand));
          }

          setResult({ ...data, items });
        } catch (err) {
          console.error("[/products] fetch failed", err);
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
  }, [filters, q, sort, page, brands, categoryTree, facetTypeMap]);

  // ── Reset page when filters/sort/q change ──
  useEffect(() => {
    setPage(1);
  }, [filters, q, sort]);

  // ── Handlers ──
  const handleFilterChange = useCallback(
    (key: string, value: FilterValue | undefined) => {
      setFilters((prev) => {
        const next = { ...prev };
        if (value === undefined) delete next[key];
        else next[key] = value;
        return next;
      });
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleRemoveChip = useCallback((chipKey: string) => {
    const [filterKey, optionValue] = chipKey.split(":");
    setFilters((prev) => {
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
  }, []);

  const handleCompare = useCallback(
    (id: string) => {
      setCompareList((prev) => {
        if (prev.some((p) => p.id === id)) return prev.filter((p) => p.id !== id);
        if (prev.length >= 3) return prev;
        const product = result.items.find((p) => p.id === id);
        if (!product) return prev;
        return [
          ...prev,
          { id, name: product.name, thumbnail: product.thumbnail, price: product.price },
        ];
      });
    },
    [result.items],
  );

  const activeFilterChips = useMemo(
    () => buildActiveFilters(filters, filterDefinitions),
    [filters, filterDefinitions],
  );

  // ── Title + breadcrumb ──
  const title = activeCategory
    ? activeCategory.name
    : activeBrand
      ? `Sản phẩm ${activeBrand.name}`
      : "Tất cả sản phẩm";

  const breadcrumbItems = useMemo(() => {
    if (activeCategory) {
      return [
        { label: "Sản phẩm", href: "/products" },
        { label: activeCategory.name },
      ];
    }
    if (activeBrand) {
      return [
        { label: "Sản phẩm", href: "/products" },
        { label: activeBrand.name },
      ];
    }
    return [{ label: "Sản phẩm" }];
  }, [activeCategory, activeBrand]);

  // ── Render ──
  const showBrandRail = !activeCategory && brands.length > 0;

  return (
    <>
      <div className="py-6 space-y-5 max-w-[1400px] mx-auto flex flex-col">
        <Breadcrumb showHome items={breadcrumbItems} />

        <h1 className="text-2xl font-bold text-secondary-900">{title}</h1>

        {showBrandRail && (
          <BrandRailVisualization
            brands={brands}
            selected={(filters.brand as string[] | undefined) ?? []}
            onToggle={(slug) =>
              setFilters((prev) => {
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
            filters={filters}
            onChange={handleFilterChange}
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
        onClose={() => setMobileFilterOpen(false)}
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
              onClick={() => setMobileFilterOpen(false)}
            >
              Xem {result.total} sản phẩm
            </Button>
          </div>
        }
      >
        <MobileFilterContent
          definitions={filterDefinitions}
          filters={filters}
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
