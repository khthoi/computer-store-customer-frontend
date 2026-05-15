"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ClockIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { formatVND } from "@/src/lib/format";
import {
  getProductVariantSuggestions,
  getSearchSuggestions,
} from "@/src/services/storefront-layout.service";
import type { SearchShortcutItem } from "@/src/types/storefront-layout.types";
import type {
  QuickSuggestionBrand,
  QuickSuggestionCategory,
  QuickSuggestionProduct,
  QuickSuggestionResponse,
  QuickSuggestionVariant,
  QuickSuggestionVariantStandalone,
} from "@/src/types/search.types";

export interface SearchSuggestionsPopoverProps {
  query: string;
  isFocused: boolean;
  onSubmit: (query: string) => void;
  onClose: () => void;
  shortcutItems: SearchShortcutItem[];
  /** Element used to compute the popover position (typically the SearchBar container). */
  anchorRef: RefObject<HTMLElement | null>;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
      {label}
    </p>
  );
}

const THUMB_CLASS =
  "relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-secondary-100 bg-secondary-50";

function Thumb({
  src,
  alt,
  fallback,
  fit = "cover",
}: {
  src: string | null;
  alt: string;
  fallback: React.ReactNode;
  fit?: "cover" | "contain";
}) {
  if (!src) {
    return (
      <div className={THUMB_CLASS} aria-hidden="true">
        {fallback}
      </div>
    );
  }
  return (
    <div className={THUMB_CLASS}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="40px"
        className={fit === "contain" ? "object-contain p-1" : "object-cover"}
      />
    </div>
  );
}

function SectionMoreLink({
  remaining,
  label,
  onClick,
}: {
  remaining: number;
  label: string;
  onClick: () => void;
}) {
  if (remaining <= 0) return null;
  return (
    <div className="px-4 pb-2 pt-1">
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
        className="cursor-pointer text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
      >
        Xem thêm {remaining} {label} →
      </button>
    </div>
  );
}

function BrandLogo({ brand }: { brand: QuickSuggestionBrand }) {
  if (brand.logoUrl) {
    return <Thumb src={brand.logoUrl} alt={brand.name} fallback={null} fit="contain" />;
  }
  const initial = brand.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={THUMB_CLASS} aria-hidden="true">
      <span className="text-sm font-semibold text-secondary-500">{initial}</span>
    </div>
  );
}

export function SearchSuggestionsPopover({
  query,
  isFocused,
  onSubmit,
  onClose,
  shortcutItems,
  anchorRef,
}: SearchSuggestionsPopoverProps) {
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [suggestions, setSuggestions] = useState<QuickSuggestionResponse | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<number>>(new Set());
  const [variantCache, setVariantCache] = useState<Map<number, QuickSuggestionVariant[]>>(
    new Map(),
  );
  const [loadingVariantIds, setLoadingVariantIds] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isFocused || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("search_history");
      setHistory(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setHistory([]);
    }
  }, [isFocused]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setIsDebouncing(false);
      setSuggestions(null);
      setExpandedProductIds(new Set());
      return;
    }

    setIsDebouncing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await getSearchSuggestions(trimmed);
        setSuggestions(result);
        setExpandedProductIds(new Set());
      } catch {
        setSuggestions(null);
      } finally {
        setIsDebouncing(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function toggleProductExpansion(product: QuickSuggestionProduct) {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });

    if (product.topVariants.length > 0 || variantCache.has(product.id)) return;
    if (loadingVariantIds.has(product.id)) return;

    setLoadingVariantIds((prev) => new Set(prev).add(product.id));
    try {
      const variants = await getProductVariantSuggestions(product.id, 5);
      setVariantCache((prev) => {
        const next = new Map(prev);
        next.set(product.id, variants);
        return next;
      });
    } catch {
      // Silent fail — UI shows empty
    } finally {
      setLoadingVariantIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  }

  function gotoProduct(product: QuickSuggestionProduct | QuickSuggestionVariantStandalone) {
    onClose();
    const slug = "slug" in product ? product.slug : product.productSlug;
    router.push(`/products/${slug}`);
  }

  function gotoVariant(productSlug: string, variantId: number) {
    onClose();
    router.push(`/products/${productSlug}?variant=${variantId}`);
  }

  function gotoBrand(brand: QuickSuggestionBrand) {
    onClose();
    const param = brand.slug || String(brand.id);
    router.push(`/search?brand=${encodeURIComponent(param)}`);
  }

  function gotoCategory(category: QuickSuggestionCategory) {
    onClose();
    router.push(`/categories/${encodeURIComponent(category.slug)}`);
  }

  function gotoAll(_type: "product" | "variant" | "brand" | "category") {
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    const params = new URLSearchParams({ q: trimmed });
    router.push(`/search?${params.toString()}`);
  }

  const matchedShortcuts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return shortcutItems.slice(0, 6);
    return shortcutItems
      .filter((item) => item.label.toLowerCase().includes(trimmed))
      .slice(0, 5);
  }, [query, shortcutItems]);

  function removeHistoryEntry(entry: string) {
    const next = history.filter((item) => item !== entry);
    setHistory(next);
    try {
      localStorage.setItem("search_history", JSON.stringify(next));
    } catch {}
  }

  function clearAllHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("search_history");
    } catch {}
  }

  const showHistory = isFocused && query.length === 0 && history.length > 0;
  const showSuggestions = isFocused && (query.length > 0 || matchedShortcuts.length > 0);
  const isOpen = showHistory || showSuggestions;

  // Recompute fixed position relative to the anchor element. The popover is
  // rendered through a portal into <body>, so we cannot rely on CSS-relative
  // positioning — this avoids being clipped by ancestor overflow/stacking contexts.
  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    function update() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, anchorRef]);

  // Close when clicking outside both the anchor and the popover itself.
  useEffect(() => {
    if (!isOpen) return;
    function handler(event: MouseEvent) {
      const target = event.target as Node;
      const anchor = anchorRef.current;
      if (anchor && anchor.contains(target)) return;
      if (popoverRef.current && popoverRef.current.contains(target)) return;
      onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !mounted || !position) return null;

  const popover = (
    <div
      ref={popoverRef}
      role="listbox"
      aria-label="Gợi ý tìm kiếm"
      className="fixed z-[9999] flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-xl"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain">
      {showHistory && (
        <div>
          <SectionHeader label="Tìm kiếm gần đây" />
          <ul>
            {history.map((entry) => (
              <li key={entry}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSubmit(entry)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                >
                  <ClockIcon className="h-4 w-4 shrink-0 text-secondary-400" />
                  <span className="flex-1 truncate">{entry}</span>
                  <span
                    role="button"
                    aria-label={`Xóa "${entry}" khỏi lịch sử`}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeHistoryEntry(entry);
                    }}
                    className="ml-auto cursor-pointer rounded p-0.5 text-secondary-400 hover:text-secondary-700"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-secondary-100 px-4 py-2">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearAllHistory}
              className="cursor-pointer text-xs text-secondary-400 transition-colors hover:text-secondary-600"
            >
              Xóa lịch sử
            </button>
          </div>
        </div>
      )}

      {showSuggestions && (
        <>
          {matchedShortcuts.length > 0 && (
            <div className={showHistory ? "border-t border-secondary-100" : ""}>
              <SectionHeader label={query.trim() ? "Danh mục phù hợp" : "Danh mục nổi bật"} />
              <ul>
                {matchedShortcuts.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onClose();
                        router.push(item.url);
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                    >
                      <FolderIcon className="h-4 w-4 shrink-0 text-secondary-400" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-secondary-100">
            <SectionHeader label="Sản phẩm" />
            {isDebouncing ? (
              <div className="space-y-1 px-4 pb-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-3 py-1.5">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions && suggestions.products.length > 0 ? (
              <ul>
                {suggestions.products.map((product) => {
                  const isExpanded = expandedProductIds.has(product.id);
                  const cachedVariants = variantCache.get(product.id);
                  const variantsToShow =
                    product.topVariants.length > 0
                      ? product.topVariants
                      : (cachedVariants ?? []);
                  const isLoadingVariants = loadingVariantIds.has(product.id);
                  const canExpand = product.variantCount > 0;

                  return (
                    <li key={product.id}>
                      <div className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-secondary-50">
                        <button
                          type="button"
                          role="option"
                          aria-selected={false}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => gotoProduct(product)}
                          className="flex flex-1 cursor-pointer items-center gap-3 text-left text-sm text-secondary-700"
                        >
                          <Thumb
                            src={product.thumbnailUrl}
                            alt={product.name}
                            fallback={<PhotoIcon className="h-5 w-5 text-secondary-300" />}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-secondary-800">
                              {product.name}
                            </span>
                            <span className="block truncate text-xs text-secondary-400">
                              {[product.brandName, product.categoryName]
                                .filter(Boolean)
                                .join(" • ")}
                            </span>
                          </span>
                        </button>
                        {canExpand && (
                          <button
                            type="button"
                            aria-label={
                              isExpanded
                                ? `Ẩn phiên bản của ${product.name}`
                                : `Xem ${product.variantCount} phiên bản của ${product.name}`
                            }
                            aria-expanded={isExpanded}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => void toggleProductExpansion(product)}
                            className="flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md border border-secondary-200 px-2 text-xs tabular-nums text-secondary-500 transition-colors hover:border-primary-300 hover:text-primary-600"
                          >
                            <span>{product.variantCount}</span>
                            <ChevronDownIcon
                              className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <ul className="bg-secondary-50/50 pb-1">
                          {isLoadingVariants && variantsToShow.length === 0 ? (
                            <li className="space-y-1 px-4 py-2">
                              {[0, 1, 2].map((index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-3 py-1"
                                >
                                  <Skeleton className="h-8 w-8 shrink-0 rounded" />
                                  <Skeleton className="h-3 w-2/3 rounded" />
                                </div>
                              ))}
                            </li>
                          ) : variantsToShow.length === 0 ? (
                            <li className="px-12 py-2 text-xs text-secondary-400">
                              Không có phiên bản nào.
                            </li>
                          ) : (
                            variantsToShow.map((variant) => (
                              <li key={variant.variantId}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={false}
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() =>
                                    gotoVariant(product.slug, variant.variantId)
                                  }
                                  className="flex w-full cursor-pointer items-center gap-3 pl-12 pr-4 py-2 text-left text-sm text-secondary-600 transition-colors hover:bg-secondary-100"
                                >
                                  <Thumb
                                    src={variant.mediaUrl ?? product.thumbnailUrl}
                                    alt={variant.name}
                                    fallback={
                                      <PhotoIcon className="h-4 w-4 text-secondary-300" />
                                    }
                                  />
                                  <span className="min-w-0 flex-1 truncate">
                                    {variant.name}
                                  </span>
                                  <span className="shrink-0 text-xs font-semibold text-primary-600">
                                    {formatVND(variant.price)}
                                  </span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : query.trim().length >= 2 ? (
              <p className="px-4 py-3 text-sm text-secondary-400">
                Không tìm thấy sản phẩm phù hợp.
              </p>
            ) : (
              <p className="px-4 py-3 text-sm text-secondary-400">
                Nhập ít nhất 2 ký tự để xem gợi ý sản phẩm.
              </p>
            )}
            {suggestions && suggestions.products.length > 0 && (
              <SectionMoreLink
                remaining={suggestions.totalProductMatches - suggestions.products.length}
                label="sản phẩm"
                onClick={() => gotoAll("product")}
              />
            )}
          </div>

          {!isDebouncing && suggestions && suggestions.variants.length > 0 && (() => {
            const productVariantIds = new Set(
              suggestions.products.flatMap((p) =>
                p.topVariants.map((v) => v.variantId),
              ),
            );
            const uniqueVariants = suggestions.variants.filter(
              (v) => !productVariantIds.has(v.variantId),
            );
            if (uniqueVariants.length === 0) return null;
            return (
              <div className="border-t border-secondary-100">
                <SectionHeader label="Phiên bản phù hợp" />
                <ul>
                  {uniqueVariants.map((variant) => (
                    <li key={variant.variantId}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          gotoVariant(variant.productSlug, variant.variantId)
                        }
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                      >
                        <Thumb
                          src={variant.mediaUrl}
                          alt={variant.name}
                          fallback={<PhotoIcon className="h-5 w-5 text-secondary-300" />}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-secondary-800">
                            {variant.name}
                          </span>
                          <span className="block truncate text-xs text-secondary-400">
                            {variant.productName}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-primary-600">
                          {formatVND(variant.price)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <SectionMoreLink
                  remaining={suggestions.totalVariantMatches - suggestions.variants.length}
                  label="phiên bản"
                  onClick={() => gotoAll("variant")}
                />
              </div>
            );
          })()}

          {!isDebouncing && suggestions && suggestions.brands.length > 0 && (
            <div className="border-t border-secondary-100">
              <SectionHeader label="Thương hiệu" />
              <ul>
                {suggestions.brands.map((brand) => (
                  <li key={brand.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => gotoBrand(brand)}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                    >
                      <BrandLogo brand={brand} />
                      <span className="flex-1 truncate font-medium text-secondary-800">
                        {brand.name}
                      </span>
                      <TagIcon
                        className="h-4 w-4 shrink-0 text-secondary-300"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <SectionMoreLink
                remaining={suggestions.totalBrandMatches - suggestions.brands.length}
                label="thương hiệu"
                onClick={() => gotoAll("brand")}
              />
            </div>
          )}

          {!isDebouncing && suggestions && suggestions.categories.length > 0 && (
            <div className="border-t border-secondary-100">
              <SectionHeader label="Danh mục" />
              <ul>
                {suggestions.categories.map((category) => (
                  <li key={category.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => gotoCategory(category)}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 transition-colors hover:bg-secondary-50"
                    >
                      <Thumb
                        src={category.iconUrl}
                        alt={category.name}
                        fallback={
                          <FolderIcon className="h-5 w-5 text-secondary-300" />
                        }
                        fit="contain"
                      />
                      <span className="flex-1 truncate font-medium text-secondary-800">
                        {category.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <SectionMoreLink
                remaining={suggestions.totalCategoryMatches - suggestions.categories.length}
                label="danh mục"
                onClick={() => gotoAll("category")}
              />
            </div>
          )}

          {query.trim().length > 0 && (
            <div className="border-t border-secondary-100">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSubmit(query)}
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
                <span>
                  Xem tất cả{" "}
                  {suggestions && suggestions.totalProductMatches > 0
                    ? `${suggestions.totalProductMatches} `
                    : ""}
                  kết quả cho “<span className="font-semibold">{query}</span>”
                </span>
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );

  return createPortal(popover, document.body);
}
