"use client";

import { useMemo, useState, type RefObject } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
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
  CATEGORY_LABELS,
  type CatalogueProduct,
  type CompareProduct,
} from "@/src/components/compare-ui/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_COMPARE = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareProductDrawerProps {
  /** Full catalogue shown in the drawer — passed from the page */
  catalogue: CatalogueProduct[];
  /** Element to scroll into view when "Xem so sánh" is clicked */
  tableRef?: RefObject<HTMLElement | null>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRANDS = ["Tất cả", "Dell", "Apple", "Asus", "MSI", "HP", "Lenovo", "Acer"];

/**
 * Builds the stable compare-list ID for a product+variant pair.
 * Single-option products (no variants, or "default" sentinel) keep the plain
 * product ID for backwards compatibility.
 */
function makeVariantId(productId: string, variantValue: string): string {
  return variantValue === "default" ? productId : `${productId}__${variantValue}`;
}

/**
 * Builds a minimal CompareProduct shell for a variant selection.
 * The store's catalogueMap enriches specGroups automatically on add.
 */
function buildVariantCompareProduct(
  product: CatalogueProduct,
  variantValue: string
): CompareProduct {
  const variant = product.variants?.find((v) => v.value === variantValue);
  // Only append the variant label when there is more than one real variant
  // (a lone "Mặc định" sentinel is invisible to the user).
  const isMultiVariant = (product.variants?.length ?? 0) > 1;
  return {
    id: makeVariantId(product.id, variantValue),
    name:
      isMultiVariant && variant
        ? `${product.name} · ${variant.label}`
        : product.name,
    brands: product.brands,
    slug: product.slug,
    category: product.category,
    currentPrice: variant?.currentPrice ?? product.currentPrice,
    originalPrice: variant?.originalPrice ?? product.originalPrice,
    discountPct: 0, // computed by PriceTag / store from currentPrice + originalPrice
    thumbnailSrc: product.thumbnailSrc,
    rating: product.rating,
    reviewCount: product.reviewCount,
    specGroups: [], // enriched from productCatalogue via the store
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareProductDrawer — left-side drawer for adding products / variants to
 * the comparison list. Opens/closes via the CompareContext.
 */
export function CompareProductDrawer({
  catalogue,
  tableRef,
}: CompareProductDrawerProps) {
  const { state, addProduct, removeProduct, closeDrawer } = useCompare();
  const { isDrawerOpen, compareList, activeCategory } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filteredCatalogue = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const minVal = minPrice ? parseInt(minPrice, 10) : null;
    const maxVal = maxPrice ? parseInt(maxPrice, 10) : null;

    return catalogue.filter((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.brands.some((b) => b.toLowerCase().includes(q))
      )
        return false;
      if (selectedBrand !== "Tất cả" && !p.brands.includes(selectedBrand))
        return false;
      if (minVal !== null && p.currentPrice < minVal * 1_000_000) return false;
      if (maxVal !== null && p.currentPrice > maxVal * 1_000_000) return false;
      return true;
    });
  }, [catalogue, searchQuery, selectedBrand, minPrice, maxPrice]);

  const handleViewCompare = () => {
    closeDrawer();
    setTimeout(() => {
      if (tableRef?.current) {
        const top = tableRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 350);
  };

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

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onClose={closeDrawer}
      position="left"
      size="xl"
      title="Chọn sản phẩm để so sánh"
      footer={footer}
    >
      {/* ── Drawer inner content ── */}
      <div className="flex flex-col gap-4">
        {/* Category lock indicator */}
        {activeCategory && (
          <div className="flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2">
            <span className="text-xs text-primary-700">
              Đang lọc:{" "}
              <strong>{CATEGORY_LABELS[activeCategory]}</strong>
            </span>
            <button
              type="button"
              aria-label="Bỏ lọc theo loại sản phẩm"
              onClick={() => {
                /* clearing category requires clearing the whole list */
              }}
              className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-primary-500 hover:bg-primary-100"
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
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

        {/* Brand pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => setSelectedBrand(brand)}
              className={[
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                selectedBrand === brand
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:text-primary-600",
              ].join(" ")}
            >
              {brand}
            </button>
          ))}
        </div>

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

        {/* Product list */}
        <div className="flex flex-col gap-1 overflow-y-auto">
          {filteredCatalogue.length === 0 ? (
            <div className="py-12 text-center text-sm text-secondary-400">
              Không tìm thấy sản phẩm
            </div>
          ) : (
            filteredCatalogue.map((p) => (
              <DrawerProductItem
                key={p.id}
                product={p}
                isIncompatible={
                  activeCategory !== null && p.category !== activeCategory
                }
                compareList={compareList}
                maxCompare={MAX_COMPARE}
                onAdd={addProduct}
                onRemove={removeProduct}
              />
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Drawer product item ───────────────────────────────────────────────────────

interface DrawerProductItemProps {
  product: CatalogueProduct;
  isIncompatible: boolean;
  /** Current compare list — used to derive selection state and limit. */
  compareList: CompareProduct[];
  maxCompare: number;
  /** Called with a fully-shaped CompareProduct when a variant is selected. */
  onAdd: (cp: CompareProduct) => void;
  /** Called with the variant's compare ID when a variant is deselected. */
  onRemove: (id: string) => void;
}

function DrawerProductItem({
  product,
  isIncompatible,
  compareList,
  maxCompare,
  onAdd,
  onRemove,
}: DrawerProductItemProps) {
  const isAtLimit = compareList.length >= maxCompare;

  // Canonical list of variants — fall back to a single "Mặc định" sentinel.
  const variants = useMemo(
    () =>
      product.variants?.length
        ? product.variants
        : [{ value: "default", label: "Mặc định" }],
    [product.variants]
  );

  // Derive which variants are currently selected from the compare list.
  // This is the single source of truth — no local state required.
  const selectedVariantValues = useMemo(
    () =>
      variants
        .filter((v) =>
          compareList.some(
            (c) => c.id === makeVariantId(product.id, v.value)
          )
        )
        .map((v) => v.value),
    [compareList, product.id, variants]
  );

  const isAdded = selectedVariantValues.length > 0;

  // Build Select options — disable un-selected options when at limit so the
  // user can still uncheck what they've already picked, but cannot add more.
  const variantOptions = useMemo<SelectOption[]>(
    () =>
      variants.map((v) => ({
        value: v.value,
        label: v.label,
        disabled: isAtLimit && !selectedVariantValues.includes(v.value),
      })),
    [variants, isAtLimit, selectedVariantValues]
  );

  // Reflect the price of the first selected variant, or the base product price.
  const firstSelectedVariant = product.variants?.find((v) =>
    selectedVariantValues.includes(v.value)
  );
  const displayCurrentPrice =
    firstSelectedVariant?.currentPrice ?? product.currentPrice;
  const displayOriginalPrice =
    firstSelectedVariant?.originalPrice ?? product.originalPrice;

  const handleChange = (value: string | string[]) => {
    const next = Array.isArray(value) ? value : value ? [value] : [];
    const prev = selectedVariantValues;

    // Add any newly selected variants
    for (const v of next) {
      if (!prev.includes(v)) {
        onAdd(buildVariantCompareProduct(product, v));
      }
    }
    // Remove any deselected variants
    for (const v of prev) {
      if (!next.includes(v)) {
        onRemove(makeVariantId(product.id, v));
      }
    }
  };

  return (
    <div
      className={[
        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
        isIncompatible
          ? "cursor-not-allowed opacity-50 border-secondary-100 bg-secondary-50"
          : isAdded
          ? "border-primary-200 bg-primary-50"
          : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50",
      ].join(" ")}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.thumbnailSrc}
        alt={product.name}
        className="mt-0.5 h-12 w-12 shrink-0 rounded-lg bg-secondary-50 object-contain p-0.5"
        loading="lazy"
        decoding="async"
      />

      {/* Info */}
      <div className="min-w-0 flex-1">
        {/* Product name — Tooltip + line-clamp-3 + opens product page in new tab */}
        <Tooltip content={product.name} placement="top">
          <a
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-3 text-xs font-medium text-secondary-800 transition-colors hover:text-primary-700 hover:underline"
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
          <Badge variant="info" size="sm">
            {CATEGORY_LABELS[product.category]}
          </Badge>
        </div>

        {/* Price — reflects first selected variant, or base price */}
        <div className="mt-1.5">
          <PriceTag
            currentPrice={displayCurrentPrice}
            originalPrice={displayOriginalPrice}
            size="sm"
          />
        </div>
      </div>

      {/* Variant select — multi-select, trigger always shows placeholder */}
      <div className="w-[148px] shrink-0">
        <Select
          options={variantOptions}
          value={selectedVariantValues}
          onChange={handleChange}
          multiple
          showSelectedInTrigger={false}
          placeholder="Chọn cấu hình"
          size="sm"
          disabled={isIncompatible}
          dropdownWidth="280px"
        />
      </div>
    </div>
  );
}
