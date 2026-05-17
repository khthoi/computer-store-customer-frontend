"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/src/components/ui/Badge";
import { RatingStars } from "@/src/components/product/atoms/RatingStars";
import { PriceTag } from "@/src/components/product/atoms/PriceTag";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import type { CompareProduct } from "@/src/components/compare-ui/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareHeaderCardProps {
  product: CompareProduct;
  onRemove: () => void;
  /** sm = mini card in CompareBar · md = full column header in table */
  size?: "sm" | "md";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompareHeaderCard({
  product,
  onRemove,
  size = "md",
}: CompareHeaderCardProps) {
  if (size === "sm") {
    return (
      <div className="relative flex w-40 shrink-0 items-center gap-2 rounded-xl border border-secondary-200 bg-white p-2 pr-8 shadow-sm">
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.thumbnailSrc}
          alt={product.name}
          className="h-10 w-10 shrink-0 rounded-lg bg-secondary-50 object-contain p-0.5"
          loading="lazy"
          decoding="async"
        />
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-secondary-800">
            {product.name}
          </p>
          <p className="text-xs font-semibold text-primary-700">
            {formatVND(product.currentPrice)}
          </p>
        </div>
        {/* Remove */}
        <button
          type="button"
          aria-label={`Xóa ${product.name} khỏi so sánh`}
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-100 text-secondary-500 transition-colors hover:bg-error-100 hover:text-error-600"
        >
          <XMarkIcon className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    );
  }

  // ── size="md" — full table column header ──────────────────────────────────
  //
  // Layout contract:
  //   • h-full fills the grid cell so all column headers share the same height
  //     (the tallest card wins; siblings stretch to match).
  //   • Top section (flex-1) grows to consume all spare vertical space:
  //       image → brand → name → rating
  //   • Bottom section (mt-auto) is always pinned to the card's bottom edge:
  //       price only (PriceTag)
  //     Because only PriceTag lives here (fixed structure), the price row
  //     aligns perfectly across every column even when one card has a
  //     strikethrough original-price line and another does not.
  //
  // Discount badge:
  //   Rendered as an absolute overlay on the image (top-left), matching the
  //   ProductCard promo-badge style. PriceTag independently shows the inline
  //   "-X%" chip next to the current price — both are intentional and
  //   redundancy is acceptable (image context vs. price context).
  //
  // PriceTag reuse:
  //   ProductCard already uses PriceTag which calls discountPercent() from
  //   @/src/lib/format internally. Passing originalPrice here delegates all
  //   discount calculation to the same component — no logic is duplicated.

  const hasDiscount =
    product.discountPct > 0 || product.originalPrice > product.currentPrice;

  return (
    <div className="relative flex h-full flex-col p-4">
      {/* Remove button — absolute positioned, does not participate in flow */}
      <button
        type="button"
        aria-label={`Xóa ${product.name} khỏi so sánh`}
        onClick={onRemove}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-secondary-100 text-secondary-500 transition-colors hover:bg-error-100 hover:text-error-600"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* ── Top section — flex-1 grows to fill all available space ── */}
      <div className="flex flex-1 flex-col gap-2">

        {/* Thumbnail + discount badge overlay */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-secondary-50">
          {hasDiscount && (
            <span className="absolute left-2 top-2 z-10 rounded bg-error-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
              -{product.discountPct > 0
                ? product.discountPct
                : Math.round(
                    ((product.originalPrice - product.currentPrice) /
                      product.originalPrice) *
                      100
                  )}%
            </span>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.thumbnailSrc}
            alt={product.name}
            className="h-full w-full object-contain p-0.5"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Brand(s) */}
        {product.brands.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.brands.map((b) => (
              <Badge
                key={b}
                variant="default"
                size="sm"
                className="w-fit uppercase tracking-wider"
              >
                {b}
              </Badge>
            ))}
          </div>
        )}

        {/* Name — Tooltip reveals the full name when it is clamped.
            min-h reserves space for 2 lines so a 1-line name never shifts
            the bottom section relative to other cards in the row.
            Clicking opens the product detail page in a new tab. */}
        <Tooltip content={product.name} placement="top">
          <a
            href={`/products/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-secondary-900 transition-colors hover:text-primary-700 hover:underline"
          >
            {product.name}
          </a>
        </Tooltip>

        {/* Rating — in the top section so the price below is the sole
            variable-height element in the bottom section */}
        <div className="min-h-[1.25rem]">
          <RatingStars value={product.rating} count={product.reviewCount} size="sm" />
        </div>
      </div>

      {/* ── Bottom section — pinned to card bottom via mt-auto ── */}
      <div className="mt-auto flex flex-col gap-2 border-t border-secondary-100 pt-3">
        {/* Price — min-h-[3.5rem] holds two lines (current + original) so
            cards without a discount don't push the button higher than cards
            that do have one */}
        <div className="min-h-[3.5rem]">
          <PriceTag
            currentPrice={product.currentPrice}
            originalPrice={hasDiscount ? product.originalPrice : undefined}
            discountPct={product.discountPct > 0 ? product.discountPct : undefined}
            size="sm"
          />
        </div>

      </div>
    </div>
  );
}
