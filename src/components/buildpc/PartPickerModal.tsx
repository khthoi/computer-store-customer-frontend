"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/src/components/navigation/Pagination";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Select } from "@/src/components/ui/Select";
import { Toggle } from "@/src/components/ui/Toggle";
import type { SelectOption } from "@/src/components/ui/Select";
import { PartPickerProductItem } from "@/src/components/buildpc/PartPickerProductItem";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartPickerProductVariant {
  /** variantId (string) — passed back via onSelect */
  value: string;
  /** Display label (typically variant name or SKU) */
  label: string;
  /** Stock at the variant level */
  stock?: number;
  /** Sale price of this variant */
  price?: number;
  /** Original price (when discounted) */
  originalPrice?: number;
}

export interface PartPickerProduct {
  id: string;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  /** Used to build the platform filter (e.g. "lga1700", "am5") */
  platform?: string;
  /** Warranty duration shown as a badge (e.g. "36 tháng") */
  warranty?: string;
  /**
   * Product variants. When provided (length >= 1), user picks a variant before adding.
   * `value` is the variantId. Each variant carries its own price + stock.
   */
  variants?: PartPickerProductVariant[];
  availability?: "in-stock" | "out-of-stock" | "limited";
  /** If provided, the product name becomes a link that opens in a new tab */
  href?: string;
  /** Remaining units — shown as "Còn N sản phẩm" in the product row */
  stockQuantity?: number;
}

export interface PartPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Human-readable label used in the modal heading */
  categoryLabel: string;
  /** Full product list for this category */
  products: PartPickerProduct[];
  /** ID of the currently selected product (if any) */
  selectedId?: string;
  /** Variant value currently stored in the build for the selected product */
  selectedVariantValue?: string;
  /** Called with the selected product id and chosen variant; modal auto-closes ~180 ms later */
  onSelect: (id: string, variantValue?: string) => void;
  /** Optional dynamic filter panel rendered above the default brand/price/platform filters */
  extraFilters?: ReactNode;
  /** When true, show a small loading hint above the product list */
  isLoading?: boolean;
  /** Stock-only filter state controlled by parent fetch layer */
  inStockOnly?: boolean;
  /** Called when the stock-only filter changes */
  onInStockOnlyChange?: (value: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

const PRICE_RANGES = [
  { id: "under-5m",  label: "Dưới 5 triệu",  min: 0,          max: 5_000_000  },
  { id: "5m-15m",    label: "5 – 15 triệu",   min: 5_000_000,  max: 15_000_000 },
  { id: "15m-30m",   label: "15 – 30 triệu",  min: 15_000_000, max: 30_000_000 },
  { id: "above-30m", label: "Trên 30 triệu",  min: 30_000_000, max: Infinity   },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: "newest",     label: "Mới nhất"          },
  { value: "price-asc",  label: "Giá: Thấp đến cao" },
  { value: "price-desc", label: "Giá: Cao đến thấp" },
];

const OVERLAY_VARIANTS = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

const MODAL_VARIANTS = {
  hidden:  { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0  },
};

const TRANSITION = { duration: 0.22, ease: "easeOut" } as const;

// ─── FilterGroup ──────────────────────────────────────────────────────────────

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-500">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function isProductInStock(product: PartPickerProduct): boolean {
  if (product.variants?.length) {
    return product.variants.some((variant) => (variant.stock ?? 0) > 0);
  }
  if (product.stockQuantity !== undefined) {
    return product.stockQuantity > 0;
  }
  return product.availability !== "out-of-stock";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PartPickerModal — part selection dialog for the Build PC configurator.
 *
 * Structure:
 *   - Fixed header: category title + search input + close button
 *   - 2-column body:
 *     - Left sidebar: brand / price-range / platform filters (Checkbox groups)
 *     - Right area:  sort dropdown, clear-filters, pagination, scrollable product list
 *
 * Animation: overlay fades, panel scales + fades in via Framer Motion.
 * Portal-rendered into document.body so no container constrains the size.
 */
export function PartPickerModal({
  isOpen,
  onClose,
  categoryLabel,
  products,
  selectedId,
  selectedVariantValue,
  onSelect,
  extraFilters,
  isLoading,
  inStockOnly = false,
  onInStockOnlyChange,
}: PartPickerModalProps) {
  const titleId  = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ── Filter + sort state ───────────────────────────────────────────────────

  const [searchQuery,         setSearchQuery]         = useState("");
  const [sortBy,              setSortBy]              = useState("newest");
  const [selectedBrands,      setSelectedBrands]      = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedPlatforms,   setSelectedPlatforms]   = useState<string[]>([]);
  const [currentPage,         setCurrentPage]         = useState(1);

  useEffect(() => { setIsMounted(true); }, []);

  // Reset filters every time the category changes (products prop swaps)
  useEffect(() => {
    setSearchQuery("");
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setSelectedPlatforms([]);
    setSortBy("newest");
    setCurrentPage(1);
  }, [products]);

  // ── Scroll lock ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // ── Focus management ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement;
    const t = setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("input[type='search'], button")
        ?.focus();
    }, 20);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
  }, [isOpen]);

  // ── Keyboard: Escape ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    },
    [onClose]
  );

  // ── Derived filter options ────────────────────────────────────────────────

  const brands = useMemo(
    () =>
      [...new Set(products.map((p) => p.brand).filter((b) => b && b.trim().length > 0))].sort(),
    [products]
  );

  const platforms = useMemo(
    () =>
      [
        ...new Set(
          products.map((p) => p.platform).filter((v): v is string => Boolean(v))
        ),
      ].sort(),
    [products]
  );

  // ── Filtering → sorting → pagination ─────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q))
        return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand))
        return false;
      if (selectedPriceRanges.length > 0) {
        const inRange = selectedPriceRanges.some((rid) => {
          const r = PRICE_RANGES.find((x) => x.id === rid);
          return r ? p.price >= r.min && p.price < r.max : false;
        });
        if (!inRange) return false;
      }
      if (
        selectedPlatforms.length > 0 &&
        p.platform &&
        !selectedPlatforms.includes(p.platform)
      )
        return false;
      if (inStockOnly && !isProductInStock(p))
        return false;
      return true;
    });
  }, [products, searchQuery, selectedBrands, selectedPriceRanges, selectedPlatforms, inStockOnly]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sortBy === "price-asc")  return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        return 0;
      }),
    [filtered, sortBy]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginated  = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 on any filter/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedBrands, selectedPriceRanges, selectedPlatforms, inStockOnly, sortBy]);

  const activeFilterCount =
    selectedBrands.length + selectedPriceRanges.length + selectedPlatforms.length + (inStockOnly ? 1 : 0);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const clearFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedPriceRanges([]);
    setSelectedPlatforms([]);
    onInStockOnlyChange?.(false);
  }, [onInStockOnlyChange]);

  const toggleBrand = useCallback(
    (brand: string) =>
      setSelectedBrands((prev) =>
        prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
      ),
    []
  );

  const togglePriceRange = useCallback(
    (id: string) =>
      setSelectedPriceRanges((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      ),
    []
  );

  const togglePlatform = useCallback(
    (platform: string) =>
      setSelectedPlatforms((prev) =>
        prev.includes(platform)
          ? prev.filter((p) => p !== platform)
          : [...prev, platform]
      ),
    []
  );

  const handleSelect = useCallback(
    (id: string, variantValue?: string) => {
      onSelect(id, variantValue);
      setTimeout(() => onClose(), 180);
    },
    [onSelect, onClose]
  );

  if (!isMounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onKeyDown={handleKeyDown}
        >
          {/* Overlay */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={TRANSITION}
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-modal"
            style={{ height: "90vh" }}
            variants={MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={TRANSITION}
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-center gap-3 border-b border-secondary-200 px-5 py-3.5">
              <h2
                id={titleId}
                className="shrink-0 text-base font-semibold text-secondary-900"
              >
                Chọn {categoryLabel}
              </h2>

              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  placeholder="Tìm kiếm theo tên hoặc thương hiệu…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-9 pr-3 text-sm text-secondary-900 placeholder:text-secondary-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20"
                />
              </div>

              {/* Close */}
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* ── 2-column body ── */}
            <div className="flex min-h-0 flex-1 divide-x divide-secondary-200 overflow-hidden">

              {/* Left: Filter sidebar */}
              <aside
                aria-label="Bộ lọc sản phẩm"
                className="w-52 shrink-0 overflow-y-auto px-4 py-4"
              >
                {extraFilters}
                {brands.length > 1 && (
                  <FilterGroup title="Nhà sản xuất">
                    {brands.map((brand) => (
                      <Checkbox
                        key={brand}
                        label={brand}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                        size="sm"
                      />
                    ))}
                  </FilterGroup>
                )}

                <FilterGroup title="Khoảng giá">
                  {PRICE_RANGES.map((range) => (
                    <Checkbox
                      key={range.id}
                      label={range.label}
                      checked={selectedPriceRanges.includes(range.id)}
                      onChange={() => togglePriceRange(range.id)}
                      size="sm"
                    />
                  ))}
                </FilterGroup>

                {platforms.length > 1 && (
                  <FilterGroup title="Nền tảng">
                    {platforms.map((platform) => (
                      <Checkbox
                        key={platform}
                        label={platform.toUpperCase()}
                        checked={selectedPlatforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                        size="sm"
                      />
                    ))}
                  </FilterGroup>
                )}
              </aside>

              {/* Right: Product list */}
              <div className="flex min-w-0 flex-1 flex-col">

                {/* Topbar: result count + clear filters + sort + pagination */}
                <div className="flex shrink-0 items-center gap-2 border-b border-secondary-200 px-4 py-2.5">
                  <span className="shrink-0 text-xs text-secondary-500">
                    {isLoading ? "Đang tải…" : `${sorted.length} sản phẩm`}
                  </span>

                  <div className="flex-1" />

                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="shrink-0 rounded text-xs font-medium text-primary-600 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Xóa bộ lọc ({activeFilterCount})
                    </button>
                  )}

                  {/* Sort */}
                  <div className="shrink-0 flex h-8 items-center">
                    <Toggle
                      label="Còn hàng"
                      checked={inStockOnly}
                      onChange={(e) => onInStockOnlyChange?.(e.target.checked)}
                      size="sm"
                      labelLeft
                      className="!mb-0 h-8"
                    />
                  </div>

                  <div className="w-44 shrink-0">
                    <Select
                      options={SORT_OPTIONS}
                      value={[sortBy]}
                      onChange={(vals) => setSortBy(vals[0] ?? "newest")}
                      size="sm"
                      placeholder="Sắp xếp"
                    />
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      size="sm"
                      page={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      siblingCount={5}
                    />
                  )}
                </div>

                {/* Scrollable product list */}
                <div className="flex-1 overflow-y-auto px-4">
                  {paginated.length > 0 ? (
                    <div className="divide-y divide-secondary-100">
                      {paginated.map((product) => (
                        <PartPickerProductItem
                          key={product.id}
                          {...product}
                          isSelected={selectedId === product.id}
                          selectedVariantValue={
                            selectedId === product.id ? selectedVariantValue : undefined
                          }
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                      <MagnifyingGlassIcon
                        className="h-10 w-10 text-secondary-300"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium text-secondary-600">
                        Không tìm thấy sản phẩm
                      </p>
                      <p className="text-xs text-secondary-400">
                        Thử thay đổi từ khóa hoặc bộ lọc
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
