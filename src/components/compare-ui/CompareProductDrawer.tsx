"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Drawer } from "@/src/components/ui/Drawer";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Badge } from "@/src/components/ui/Badge";
import { Select } from "@/src/components/ui/Select";
import type { SelectOption } from "@/src/components/ui/Select";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { PriceTag } from "@/src/components/product/PriceTag";
import { useCompare } from "@/src/store/compare.store";
import {
  searchCompareProducts,
  getCategoryFacets,
  getAllBrandsForCompare,
} from "@/src/services/compare.service";
import type {
  CatalogueProduct,
  CompareBrand,
  CompareFacetGroup,
  CompareFacetType,
  CompareProduct,
  CompareSpecFilterValue,
} from "@/src/components/compare-ui/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_COMPARE = 4;
const PAGE_SIZE = 20;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareProductDrawerProps {
  /** Element to scroll into view when "Xem so sánh" is clicked */
  tableRef?: RefObject<HTMLElement | null>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeVariantId(productId: string, variantValue: string): string {
  return variantValue === "default" ? productId : `${productId}__${variantValue}`;
}

function buildVariantCompareProduct(
  product: CatalogueProduct,
  variantValue: string,
): CompareProduct {
  const variant = product.variants?.find((v) => v.value === variantValue);
  const isMultiVariant = (product.variants?.length ?? 0) > 1;
  return {
    id: makeVariantId(product.id, variantValue),
    name:
      isMultiVariant && variant
        ? `${product.name} · ${variant.label}`
        : product.name,
    brands: product.brands,
    slug: product.slug,
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    rootCategoryId: product.rootCategoryId,
    rootCategoryName: product.rootCategoryName,
    category: product.category,
    currentPrice: variant?.currentPrice ?? product.currentPrice,
    originalPrice: variant?.originalPrice ?? product.originalPrice,
    discountPct: 0,
    thumbnailSrc: product.thumbnailSrc,
    rating: product.rating,
    reviewCount: product.reviewCount,
    specGroups: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompareProductDrawer({ tableRef }: CompareProductDrawerProps) {
  const { state, addProduct, removeProduct, closeDrawer } = useCompare();
  const { isDrawerOpen, compareList, activeRootCategoryId } = state;

  // Lock by the backend root categoryId (already computed when the first
  // product was added). This scopes the drawer to all descendants of the
  // root, so siblings under different branches still appear.
  const lockedCategoryId =
    activeRootCategoryId ||
    compareList.find((p) => p.rootCategoryId)?.rootCategoryId ||
    compareList.find((p) => p.categoryId)?.categoryId ||
    null;
  const lockedCategoryName: string | null =
    compareList[0]?.rootCategoryName || null;

  // ── Filter state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [specFilters, setSpecFilters] = useState<
    Record<number, CompareSpecFilterValue>
  >({});

  // ── Brand catalogue (drawer-wide, loaded once) ───────────────────────────
  const [brands, setBrands] = useState<CompareBrand[]>([]);
  useEffect(() => {
    let cancelled = false;
    getAllBrandsForCompare().then((list) => {
      if (!cancelled) setBrands(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Data state ───────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CatalogueProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState<CompareFacetGroup[]>([]);

  // Reset page + filters when the locked category changes.
  const prevLockRef = useRef<string | null>(lockedCategoryId);
  useEffect(() => {
    if (prevLockRef.current !== lockedCategoryId) {
      prevLockRef.current = lockedCategoryId;
      setPage(1);
      setSpecFilters({});
      setSelectedBrandIds([]);
    }
  }, [lockedCategoryId]);

  // Reset page when search / price / spec filters change (but NOT for page).
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        searchQuery,
        minPrice,
        maxPrice,
        specFilters,
        selectedBrandIds,
        lockedCategoryId,
      }),
    [
      searchQuery,
      minPrice,
      maxPrice,
      specFilters,
      selectedBrandIds,
      lockedCategoryId,
    ],
  );
  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setPage(1);
  }, [filtersKey]);

  // ── Fetch facet schema when category lock changes ────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!lockedCategoryId) {
      setFacets([]);
      return;
    }
    getCategoryFacets(lockedCategoryId).then((groups) => {
      if (!cancelled) setFacets(groups);
    });
    return () => {
      cancelled = true;
    };
  }, [lockedCategoryId]);

  // ── Fetch product page — debounced for search; immediate otherwise ───────
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchRef = useRef(searchQuery);
  useEffect(() => {
    if (!isDrawerOpen) return;
    const isSearchChange = searchQuery !== prevSearchRef.current;
    prevSearchRef.current = searchQuery;

    if (fetchTimer.current) clearTimeout(fetchTimer.current);
    fetchTimer.current = setTimeout(
      async () => {
        setLoading(true);
        try {
          const result = await searchCompareProducts({
            categoryId: lockedCategoryId,
            categoryName: lockedCategoryName,
            page,
            limit: PAGE_SIZE,
            q: searchQuery || undefined,
            brandIds:
              selectedBrandIds.length > 0 ? selectedBrandIds : undefined,
            minPrice: minPrice ? Number(minPrice) * 1_000_000 : undefined,
            maxPrice: maxPrice ? Number(maxPrice) * 1_000_000 : undefined,
            specs: Object.keys(specFilters).length > 0 ? specFilters : undefined,
          });
          // Defensive client-side filter: drop items whose root category id
          // doesn't match the active lock. Catches edge cases where backend
          // filtering is too permissive (e.g. category-name LIKE match).
          const filtered = activeRootCategoryId
            ? result.items.filter(
                (p: CatalogueProduct) =>
                  p.rootCategoryId === activeRootCategoryId,
              )
            : result.items;
          setItems(filtered);
          setTotal(result.total);
          setTotalPages(result.totalPages);
        } finally {
          setLoading(false);
        }
      },
      isSearchChange ? 300 : 0,
    );
    return () => {
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
    };
  }, [
    isDrawerOpen,
    page,
    searchQuery,
    minPrice,
    maxPrice,
    specFilters,
    selectedBrandIds,
    lockedCategoryId,
    lockedCategoryName,
    activeRootCategoryId,
  ]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleViewCompare = useCallback(() => {
    closeDrawer();
    setTimeout(() => {
      if (tableRef?.current) {
        const top =
          tableRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 350);
  }, [closeDrawer, tableRef]);

  const setSpecFilter = useCallback(
    (typeId: number, value: CompareSpecFilterValue | null) => {
      setSpecFilters((prev) => {
        const next = { ...prev };
        if (value == null) {
          delete next[typeId];
        } else {
          next[typeId] = value;
        }
        return next;
      });
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSpecFilters({});
    setSelectedBrandIds([]);
  }, []);

  const toggleBrand = useCallback((brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId],
    );
  }, []);

  const hasActiveFilters =
    searchQuery !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    selectedBrandIds.length > 0 ||
    Object.keys(specFilters).length > 0;

  // ── Footer ───────────────────────────────────────────────────────────────

  const footer = (
    <Button
      variant="primary"
      size="md"
      fullWidth
      disabled={compareList.length < 2}
      onClick={handleViewCompare}
    >
      Xem so sánh ({compareList.length}/{MAX_COMPARE})
    </Button>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      position="left"
      size="2xl"
      title="Chọn sản phẩm để so sánh"
      footer={footer}
    >
      <div className="flex flex-col gap-4">
        {/* Category lock indicator */}
        {lockedCategoryName && (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2">
            <span className="text-xs text-primary-700">
              Đang lọc:{" "}
              <strong>{lockedCategoryName}</strong>
            </span>
          </div>
        )}

        {/* Selected count + limit hint */}
        <p className="text-sm text-secondary-500">
          Đã chọn:{" "}
          <strong className="text-secondary-800">{compareList.length}</strong>
          /{MAX_COMPARE} sản phẩm
          {compareList.length >= MAX_COMPARE && (
            <span className="ml-1.5 text-error-600">(Đã đạt giới hạn)</span>
          )}
        </p>

        {/* Search */}
        <Input
          placeholder="Tìm theo tên hoặc thương hiệu…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          prefixIcon={<MagnifyingGlassIcon />}
          size="sm"
        />

        {/* Price range */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Từ (triệu ₫)"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            size="sm"
          />
          <span className="shrink-0 text-secondary-400">–</span>
          <Input
            type="number"
            placeholder="Đến (triệu ₫)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            size="sm"
          />
        </div>

        {/* Brand multi-select */}
        {brands.length > 0 && (
          <BrandFilter
            brands={brands}
            selectedIds={selectedBrandIds}
            onToggle={toggleBrand}
            onClear={() => setSelectedBrandIds([])}
          />
        )}

        {/* Dynamic spec facets — only when a category is locked */}
        {lockedCategoryId && facets.length > 0 && (
          <FacetPanel
            facets={facets}
            specFilters={specFilters}
            onChange={setSpecFilter}
          />
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="self-start text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Xóa tất cả bộ lọc
          </button>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between text-xs text-secondary-500">
          <span>
            {loading
              ? "Đang tải…"
              : `${total} sản phẩm`}
          </span>
          {totalPages > 1 && (
            <span>
              Trang {page}/{totalPages}
            </span>
          )}
        </div>

        {/* Product list */}
        <div className="flex flex-col gap-1">
          {!loading && items.length === 0 ? (
            <div className="py-12 text-center text-sm text-secondary-400">
              Không tìm thấy sản phẩm
            </div>
          ) : (
            items.map((p) => (
              <DrawerProductItem
                key={p.id}
                product={p}
                compareList={compareList}
                maxCompare={MAX_COMPARE}
                onAdd={addProduct}
                onRemove={removeProduct}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        )}
      </div>
    </Drawer>
  );
}

// ─── Pagination bar ───────────────────────────────────────────────────────────

interface PaginationBarProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function PaginationBar({ page, totalPages, onChange }: PaginationBarProps) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Build a compact list of page buttons: 1 … p-1 p p+1 … total
  const pages = useMemo(() => {
    const out: (number | "ellipsis")[] = [];
    const push = (v: number | "ellipsis") => out.push(v);
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return out;
    }
    push(1);
    if (page > 3) push("ellipsis");
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) push(i);
    if (page < totalPages - 2) push("ellipsis");
    push(totalPages);
    return out;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-center gap-1 pt-2">
      <button
        type="button"
        aria-label="Trang trước"
        disabled={!canPrev}
        onClick={() => canPrev && onChange(page - 1)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
          canPrev
            ? "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:text-primary-600"
            : "cursor-not-allowed border-secondary-100 text-secondary-300",
        ].join(" ")}
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="px-1 text-xs text-secondary-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={[
              "flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-xs font-medium transition-colors",
              p === page
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:text-primary-600",
            ].join(" ")}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        aria-label="Trang sau"
        disabled={!canNext}
        onClick={() => canNext && onChange(page + 1)}
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
          canNext
            ? "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:text-primary-600"
            : "cursor-not-allowed border-secondary-100 text-secondary-300",
        ].join(" ")}
      >
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Brand multi-select filter ───────────────────────────────────────────────

interface BrandFilterProps {
  brands: CompareBrand[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

function BrandFilter({
  brands,
  selectedIds,
  onToggle,
  onClear,
}: BrandFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const filtered = useMemo(() => {
    const q = brandQuery.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandQuery]);

  const VISIBLE_LIMIT = 12;
  const visible = expanded ? filtered : filtered.slice(0, VISIBLE_LIMIT);
  const selectedCount = selectedIds.length;

  return (
    <details
      open
      className="group rounded-md border border-secondary-200 bg-white"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-700">
        <span>
          Thương hiệu
          {selectedCount > 0 && (
            <span className="ml-1.5 rounded-full bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700">
              {selectedCount}
            </span>
          )}
        </span>
        <span className="text-secondary-400 transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>

      <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
        {brands.length > 8 && (
          <Input
            placeholder="Tìm thương hiệu…"
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            size="sm"
          />
        )}

        <div className="flex flex-wrap gap-1.5">
          {visible.length === 0 ? (
            <span className="text-xs text-secondary-400">
              Không tìm thấy thương hiệu
            </span>
          ) : (
            visible.map((b) => {
              const isSelected = selectedIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onToggle(b.id)}
                  aria-pressed={isSelected}
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    isSelected
                      ? "border-primary-500 bg-primary-500 text-white hover:bg-primary-600"
                      : "border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 hover:text-primary-600",
                  ].join(" ")}
                  title={isSelected ? `Bỏ chọn ${b.name}` : `Chọn ${b.name}`}
                >
                  {b.name}
                  {isSelected && (
                    <XMarkIcon
                      className="h-3 w-3 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between">
          {filtered.length > VISIBLE_LIMIT && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-[11px] font-medium text-primary-600 hover:underline"
            >
              {expanded
                ? "Thu gọn"
                : `Xem thêm (${filtered.length - VISIBLE_LIMIT})`}
            </button>
          )}
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="ml-auto text-[11px] font-medium text-error-600 hover:underline"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

// ─── Dynamic facet panel ─────────────────────────────────────────────────────

interface FacetPanelProps {
  facets: CompareFacetGroup[];
  specFilters: Record<number, CompareSpecFilterValue>;
  onChange: (typeId: number, value: CompareSpecFilterValue | null) => void;
}

function FacetPanel({ facets, specFilters, onChange }: FacetPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-secondary-200 bg-secondary-50/50 p-3">
      {facets.map((group) => (
        <details
          key={group.id}
          open
          className="group rounded-md border border-secondary-200 bg-white"
        >
          <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-secondary-700">
            <span>{group.label}</span>
            <span className="text-secondary-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="flex flex-col gap-2 px-3 pb-3 pt-1">
            {group.types.map((t) => (
              <FacetTypeControl
                key={t.key}
                facet={t}
                value={specFilters[t.specTypeId]}
                onChange={(v) => onChange(t.specTypeId, v)}
              />
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

// ─── Single facet control (checkbox / select / range / toggle) ───────────────

interface FacetTypeControlProps {
  facet: CompareFacetType;
  value: CompareSpecFilterValue | undefined;
  onChange: (value: CompareSpecFilterValue | null) => void;
}

function FacetTypeControl({ facet, value, onChange }: FacetTypeControlProps) {
  const label = facet.unit ? `${facet.label} (${facet.unit})` : facet.label;

  if (facet.widget === "toggle") {
    const checked = value?.toggle === true;
    return (
      <label className="flex cursor-pointer items-center justify-between gap-2 text-xs text-secondary-700">
        <span>{label}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? { toggle: true } : null)}
          className="h-4 w-4 cursor-pointer rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
        />
      </label>
    );
  }

  if (facet.widget === "range") {
    const min = value?.min ?? "";
    const max = value?.max ?? "";
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-secondary-700">{label}</span>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            placeholder={facet.min != null ? String(facet.min) : "Từ"}
            value={String(min)}
            onChange={(e) => {
              const raw = e.target.value;
              const nextMin = raw === "" ? undefined : Number(raw);
              const nextMax = value?.max;
              if (nextMin == null && nextMax == null) onChange(null);
              else onChange({ min: nextMin, max: nextMax });
            }}
            size="sm"
          />
          <span className="shrink-0 text-secondary-400">–</span>
          <Input
            type="number"
            placeholder={facet.max != null ? String(facet.max) : "Đến"}
            value={String(max)}
            onChange={(e) => {
              const raw = e.target.value;
              const nextMax = raw === "" ? undefined : Number(raw);
              const nextMin = value?.min;
              if (nextMin == null && nextMax == null) onChange(null);
              else onChange({ min: nextMin, max: nextMax });
            }}
            size="sm"
          />
        </div>
      </div>
    );
  }

  // checkbox / select — option list
  const options = facet.options ?? [];
  if (options.length === 0) return null;

  if (facet.widget === "select") {
    const selectOptions: SelectOption[] = options.map((o) => ({
      value: o.value,
      label: `${o.label} (${o.count})`,
    }));
    const selected = value?.values ?? [];
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-secondary-700">{label}</span>
        <Select
          options={selectOptions}
          value={selected}
          onChange={(v) => {
            const next = Array.isArray(v) ? v : v ? [v] : [];
            onChange(next.length === 0 ? null : { values: next });
          }}
          multiple
          placeholder="Tất cả"
          size="sm"
        />
      </div>
    );
  }

  // checkbox (default)
  return (
    <FacetCheckboxGroup
      label={label}
      options={options}
      value={value}
      onChange={onChange}
    />
  );
}

// ─── Checkbox facet (extracted so useState isn't called after early returns) ──

interface FacetCheckboxGroupProps {
  label: string;
  options: NonNullable<CompareFacetType["options"]>;
  value: CompareSpecFilterValue | undefined;
  onChange: (value: CompareSpecFilterValue | null) => void;
}

function FacetCheckboxGroup({
  label,
  options,
  value,
  onChange,
}: FacetCheckboxGroupProps) {
  const VISIBLE_LIMIT = 6;
  const [expanded, setExpanded] = useState(false);

  const selectedValues = new Set(value?.values ?? []);
  const toggleValue = (v: string) => {
    const next = new Set(selectedValues);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    const arr = Array.from(next);
    onChange(arr.length === 0 ? null : { values: arr });
  };
  const visible = expanded ? options : options.slice(0, VISIBLE_LIMIT);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-secondary-700">{label}</span>
      <div className="flex flex-col gap-1">
        {visible.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 text-xs text-secondary-600 hover:text-secondary-900"
          >
            <input
              type="checkbox"
              checked={selectedValues.has(o.value)}
              onChange={() => toggleValue(o.value)}
              className="h-3.5 w-3.5 cursor-pointer rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="flex-1 truncate">{o.label}</span>
            <span className="text-[10px] text-secondary-400">({o.count})</span>
          </label>
        ))}
        {options.length > VISIBLE_LIMIT && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="self-start text-[11px] font-medium text-primary-600 hover:underline"
          >
            {expanded
              ? "Thu gọn"
              : `Xem thêm (${options.length - VISIBLE_LIMIT})`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Drawer product item ──────────────────────────────────────────────────────

interface DrawerProductItemProps {
  product: CatalogueProduct;
  compareList: CompareProduct[];
  maxCompare: number;
  onAdd: (cp: CompareProduct) => void;
  onRemove: (id: string) => void;
}

function DrawerProductItem({
  product,
  compareList,
  maxCompare,
  onAdd,
  onRemove,
}: DrawerProductItemProps) {
  const isAtLimit = compareList.length >= maxCompare;

  const variants = useMemo(
    () =>
      product.variants?.length
        ? product.variants
        : [{ value: "default", label: "Mặc định" }],
    [product.variants],
  );

  // Pre-pick the default variant (or first/only variant) so adding to compare
  // is a single click instead of "open Select → pick → confirm".
  const defaultVariantValue = useMemo(
    () => variants.find((v) => v.isDefault)?.value ?? variants[0].value,
    [variants],
  );
  const hasMultipleVariants = variants.length > 1;

  const selectedVariantValues = useMemo(
    () =>
      variants
        .filter((v) =>
          compareList.some(
            (c) => c.id === makeVariantId(product.id, v.value),
          ),
        )
        .map((v) => v.value),
    [compareList, product.id, variants],
  );

  const isAdded = selectedVariantValues.length > 0;
  const isDefaultAdded = selectedVariantValues.includes(defaultVariantValue);

  // Secondary multi-variant picker — opens an inline expandable section so
  // users who want a non-default variant can still pick it explicitly.
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);

  const variantOptions = useMemo<SelectOption[]>(
    () =>
      variants.map((v) => ({
        value: v.value,
        label: v.label,
        disabled: isAtLimit && !selectedVariantValues.includes(v.value),
      })),
    [variants, isAtLimit, selectedVariantValues],
  );

  const firstSelectedVariant = product.variants?.find((v) =>
    selectedVariantValues.includes(v.value),
  );
  const defaultVariantData = product.variants?.find(
    (v) => v.value === defaultVariantValue,
  );
  const displayCurrentPrice =
    firstSelectedVariant?.currentPrice ??
    defaultVariantData?.currentPrice ??
    product.currentPrice;
  const displayOriginalPrice =
    firstSelectedVariant?.originalPrice ??
    defaultVariantData?.originalPrice ??
    product.originalPrice;

  const handleSelectChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value : value ? [value] : [];
    const prev = selectedVariantValues;
    for (const v of next) {
      if (!prev.includes(v)) onAdd(buildVariantCompareProduct(product, v));
    }
    for (const v of prev) {
      if (!next.includes(v)) onRemove(makeVariantId(product.id, v));
    }
  };

  const handlePrimaryToggle = () => {
    if (isDefaultAdded) {
      onRemove(makeVariantId(product.id, defaultVariantValue));
      return;
    }
    if (isAtLimit) return;
    onAdd(buildVariantCompareProduct(product, defaultVariantValue));
  };

  const primaryDisabled = !isDefaultAdded && isAtLimit;

  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-xl border p-3 transition-colors",
        isAdded
          ? "border-primary-200 bg-primary-50"
          : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnailSrc}
          alt={product.name}
          className="mt-0.5 h-12 w-12 shrink-0 rounded-lg bg-secondary-50 object-contain p-0.5"
          loading="lazy"
          decoding="async"
        />

        <div className="min-w-0 flex-1">
          <Tooltip content={product.name} placement="top" anchorToContent>
            <a
              href={`/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-xs font-medium text-secondary-800 transition-colors hover:text-primary-700 hover:underline"
            >
              {product.name}
            </a>
          </Tooltip>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {product.brands.map((b) => (
              <Badge key={b} variant="default" size="sm">
                {b}
              </Badge>
            ))}
            {product.rootCategoryName && (
              <Badge variant="info" size="sm">
                {product.rootCategoryName}
              </Badge>
            )}
          </div>

          <div className="mt-1.5">
            <PriceTag
              currentPrice={displayCurrentPrice}
              originalPrice={displayOriginalPrice}
              size="sm"
            />
          </div>
        </div>

        {/* Right-side action: one-click toggle of the default variant. */}
        <div className="flex w-[180px] shrink-0 flex-col items-stretch gap-1.5">
          {/* Default variant name preview — tells the user exactly what gets added */}
          <Tooltip
            content={defaultVariantData?.label ?? "Mặc định"}
            placement="top"
            anchorToContent
          >
            <span className="block truncate text-right text-[11px] leading-tight text-secondary-500">
              <span className="text-secondary-400">Mặc định: </span>
              <span className="font-medium text-secondary-700">
                {defaultVariantData?.label ?? "Mặc định"}
              </span>
            </span>
          </Tooltip>

          <button
            type="button"
            onClick={handlePrimaryToggle}
            disabled={primaryDisabled}
            className={[
              "inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
              isDefaultAdded
                ? "bg-primary-600 text-white hover:bg-primary-700"
                : primaryDisabled
                  ? "cursor-not-allowed bg-secondary-100 text-secondary-400"
                  : "border border-primary-500 bg-white text-primary-600 hover:bg-primary-50",
            ].join(" ")}
            aria-pressed={isDefaultAdded}
          >
            {isDefaultAdded ? "✓ Đã thêm" : "+ Thêm"}
          </button>

          {hasMultipleVariants && (
            <button
              type="button"
              onClick={() => setVariantPickerOpen((v) => !v)}
              className="text-right text-[11px] font-medium text-primary-600 hover:text-primary-700 hover:underline"
              aria-expanded={variantPickerOpen}
            >
              {variantPickerOpen ? "Ẩn cấu hình khác" : "Cấu hình khác"}
              {selectedVariantValues.length > 1 && (
                <span className="ml-1 text-secondary-500">
                  ({selectedVariantValues.length})
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Inline variant picker — only when the user explicitly opens it. */}
      {hasMultipleVariants && variantPickerOpen && (
        <div className="ml-[60px]">
          <Select
            options={variantOptions}
            value={selectedVariantValues}
            onChange={handleSelectChange}
            multiple
            showSelectedInTrigger
            placeholder="Chọn phiên bản khác"
            size="sm"
            dropdownWidth="max-content"
          />
        </div>
      )}
    </div>
  );
}
