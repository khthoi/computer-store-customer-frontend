"use client";

import Image from "next/image";
import { useCallback } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Badge } from "@/src/components/ui/Badge";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { QuantityStepper } from "@/src/components/product/QuantityStepper";
import { formatVND } from "@/src/lib/format";
import type { CartItem as CartItemType } from "@/src/store/cart.store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartItemProps {
  item: CartItemType;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

// ─── Sub-component: remove button ─────────────────────────────────────────────

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Xoá sản phẩm"
      onClick={onClick}
      className="shrink-0 rounded-lg p-1.5 text-secondary-400 hover:text-error-500 hover:bg-error-50 transition-colors"
    >
      <TrashIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

// ─── Sub-component: line price ────────────────────────────────────────────────
//
// Shows price × quantity as the primary figure. When a discount applies,
// renders a `-N%` badge (same visual language as PriceTag) and a strikethrough
// original line price below.

function LinePrice({
  currentPrice,
  originalPrice,
  discountPct,
  quantity,
}: {
  currentPrice: number;
  originalPrice: number;
  discountPct: number;
  quantity: number;
}) {
  const linePrice = currentPrice * quantity;
  const originalLinePrice = originalPrice * quantity;
  const hasDiscount = originalPrice > currentPrice;
  // Prefer the explicit discountPct; fall back to computed value.
  const pct =
    discountPct > 0
      ? discountPct
      : hasDiscount
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

  return (
    <div className="text-right">
      {/* Price with superscript-style discount badge */}
      <div className={`relative inline-flex items-end justify-end${pct > 0 ? " pt-2.5" : ""}`}>
        {pct > 0 && (
          <span className="absolute -top-2 -right-4 inline-flex items-center rounded bg-error-600 px-1 py-1 text-[11px] font-bold text-white leading-none">
            -{pct}%
          </span>
        )}
        <p className="text-sm font-semibold text-secondary-900">
          {formatVND(linePrice)}
        </p>
      </div>

      {/* Original line price */}
      {hasDiscount && (
        <p className="text-xs text-secondary-400 line-through">
          {formatVND(originalLinePrice)}
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CartItem — one row in the cart.
 *
 * Mobile  : checkbox + thumbnail → product info → qty + price + remove
 * Desktop : flat grid [checkbox | thumbnail | info | stepper | price | remove]
 *
 * Product name:
 * - Clamped to 3 lines; overflows to "…"
 * - Tooltip shows full name on hover (FloatingPortal — never clipped by cart layout)
 * - Opens product page in a new tab on click
 */
export function CartItem({
  item,
  isSelected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
}: CartItemProps) {
  const isOOS = item.stockStatus === "out-of-stock";

  const handleQtyChange = useCallback(
    (qty: number) => onQuantityChange(item.id, qty),
    [item.id, onQuantityChange]
  );
  const handleRemove = useCallback(
    () => onRemove(item.id),
    [item.id, onRemove]
  );
  const handleToggle = useCallback(
    () => onToggleSelect(item.id),
    [item.id, onToggleSelect]
  );

  // Shared price block rendered in both mobile and desktop sections
  const priceBlock = (
    <LinePrice
      currentPrice={item.currentPrice}
      originalPrice={item.originalPrice}
      discountPct={item.discountPct}
      quantity={item.quantity}
    />
  );

  // Product name: clamped + tooltip + new-tab link (reuses Tooltip pattern
  // established in ContactModal's product name display)
  const productNameLink = (
    <Tooltip content={item.name} placement="top" delay={400}>
      <a
        href={`/products/${item.slug}`}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block text-sm font-medium text-secondary-900 line-clamp-3 hover:text-primary-600 transition-colors"
      >
        {item.name}
      </a>
    </Tooltip>
  );

  return (
    <article
      className={[
        "flex gap-3 py-4 transition-opacity duration-200",
        isOOS ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={item.name}
    >
      {/* ── Checkbox ─────────────────────────────────────────────────────── */}
      <div className="mt-1 shrink-0">
        <Checkbox
          size="sm"
          checked={isSelected}
          onChange={handleToggle}
          aria-label={`Chọn ${item.name}`}
        />
      </div>

      {/* ── Thumbnail ────────────────────────────────────────────────────── */}
      <div className="shrink-0">
        <Image
          src={item.thumbnailSrc}
          alt={item.name}
          width={100}
          height={100}
          quality={75}
          objectFit="cover"
          className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg object-cover border border-secondary-100"
        />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:items-center sm:gap-6">

        {/* Info block */}
        <div className="flex-1 min-w-0">
          {/* Brand pill */}
          <a
            href={`/products?brand=${encodeURIComponent(item.brand)}`}
            tabIndex={-1}
            className="inline-flex items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-500 hover:bg-secondary-200 transition-colors"
          >
            {item.brand}
          </a>

          {/* Product name — 3-line clamp + tooltip + new tab */}
          {productNameLink}

          {/* Variant label — 1-line clamp with full-text tooltip on hover */}
          {item.variantLabel && (
            <Tooltip content={item.variantLabel} placement="top" delay={300} anchorToContent>
              <p className="mt-0.5 text-xs text-secondary-500 truncate max-w-full cursor-default">
                {item.variantLabel}
              </p>
            </Tooltip>
          )}

          {/* OOS badge */}
          {isOOS && (
            <div className="mt-1.5">
              <Badge variant="error" size="sm">Hết hàng</Badge>
            </div>
          )}

          {/* ── Mobile: qty + price + remove ──────────────────────────── */}
          <div className="flex items-center gap-3 mt-3 sm:hidden">
            <QuantityStepper
              value={item.quantity}
              min={1}
              max={item.stockQuantity}
              onChange={handleQtyChange}
              disabled={isOOS}
            />
            <div className="flex-1">{priceBlock}</div>
            <RemoveButton onClick={handleRemove} />
          </div>
        </div>

        {/* ── Desktop: qty + price + remove ─────────────────────────────── */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <QuantityStepper
            value={item.quantity}
            min={1}
            max={item.stockQuantity}
            onChange={handleQtyChange}
            disabled={isOOS}
          />
          <div className="w-28">{priceBlock}</div>
          <RemoveButton onClick={handleRemove} />
        </div>
      </div>
    </article>
  );
}
