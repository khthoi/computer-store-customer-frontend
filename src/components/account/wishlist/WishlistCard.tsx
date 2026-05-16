"use client";

import Image from "next/image";
import {
  XMarkIcon,
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { Badge } from "@/src/components/ui/Badge";
import { PriceTag } from "@/src/components/product/PriceTag";
import type { WishlistVariantItem } from "@/src/types/wishlist.types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WishlistCardProps {
  item: WishlistVariantItem;
  isInCompare?: boolean;
  onRemove: (id: string) => void;
  onAddToCart: (id: string) => void;
  onCompare: (id: string) => void;
}

// ─── Icon action button (matches ProductCard) ────────────────────────────────

interface IconActionButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

function IconActionButton({
  label,
  onClick,
  disabled = false,
  active = false,
  children,
}: IconActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
        disabled
          ? "cursor-not-allowed border-secondary-100 text-secondary-300"
          : active
            ? "border-primary-200 bg-primary-50 text-primary-600"
            : "border-secondary-200 bg-white text-secondary-500 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WishlistCard — displays a single wishlisted product variant.
 *
 * Mirrors ProductCard layout so cards keep their meta rows perfectly aligned
 * regardless of how much information any single variant has.
 */
export function WishlistCard({
  item,
  isInCompare = false,
  onRemove,
  onAddToCart,
  onCompare,
}: WishlistCardProps) {
  const productHref = `/products/${item.productSlug}`;
  const isOutOfStock = item.outOfStock;
  const brands = (item.brands ?? []).filter(
    (b) => b && b.trim().length > 0,
  );

  return (
    <article className="group relative flex h-full min-h-[480px] flex-col overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* ── 1. Thumbnail ─────────────────────────────────────────────────── */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-secondary-50">
        <a
          href={productHref}
          tabIndex={-1}
          aria-hidden="true"
          className="block h-full w-full"
        >
          <Image
            src={item.thumbnailSrc}
            alt={item.productName}
            fill
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </a>

        {/* Out-of-stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-secondary-700">
              Hết hàng
            </span>
          </div>
        )}

        {/* Heart icon — top-left, decorative (item is already wishlisted) */}
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm">
          <HeartIcon className="h-4 w-4 text-error-500" aria-hidden />
        </span>

        {/* Remove button — top-right */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-error-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={`Xóa ${item.productName} khỏi danh sách yêu thích`}
        >
          <XMarkIcon className="h-4 w-4 text-secondary-500" aria-hidden />
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3">
        {/* ── 2. Brand + Category badges ─────────────────────────────────── */}
        <div className="flex min-h-[20px] flex-wrap items-center gap-1">
          {brands.map((b) => (
            <span
              key={b}
              className="inline-flex w-fit items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-600"
            >
              {b}
            </span>
          ))}
          {item.categoryName && (
            <span className="inline-flex w-fit items-center rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
              {item.categoryName}
            </span>
          )}
        </div>

        {/* ── 3. Product name — exactly 3 lines ─────────────────────────── */}
        <Tooltip content={item.productName} placement="top">
          <a
            href={productHref}
            className="mt-1.5 line-clamp-3 h-[4.2em] overflow-hidden leading-[1.4] text-sm font-medium text-secondary-900 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            {item.productName}
          </a>
        </Tooltip>

        {/* ── 4. SKU badge — reserves height when absent ────────────────── */}
        <div className="mt-1.5 flex min-h-[20px] min-w-0 items-center">
          {item.sku && (
            <Badge
              variant="default"
              size="sm"
              className="font-mono tracking-wide min-w-0 max-w-full"
            >
              <span className="block truncate" title={item.sku}>
                {item.sku}
              </span>
            </Badge>
          )}
        </div>

        {/* ── 5. Variant label ──────────────────────────────────────────── */}
        <div className="mt-1.5 flex min-h-[1.25rem] items-start">
          <span className="line-clamp-1 text-xs leading-tight text-secondary-400">
            {item.variantLabel}
          </span>
        </div>

        {/* ── 6. Price — discount badge built into PriceTag ─────────────── */}
        <div className="mt-2 min-h-[48px]">
          <PriceTag
            currentPrice={item.currentPrice}
            originalPrice={item.originalPrice}
            size="sm"
          />
          {!item.originalPrice && (
            <span
              className="select-none opacity-0 text-xs"
              aria-hidden="true"
            >
              placeholder
            </span>
          )}
        </div>

        {/* ── 7. Action buttons — pinned to bottom ──────────────────────── */}
        <div className="mt-auto flex items-center justify-end gap-2 border-t border-secondary-100 pt-2">
          <IconActionButton
            label={isInCompare ? "Đã có trong so sánh" : "So sánh"}
            onClick={() => onCompare(item.id)}
            active={isInCompare}
          >
            <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden />
          </IconActionButton>

          <IconActionButton
            label={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
            onClick={() => !isOutOfStock && onAddToCart(item.id)}
            disabled={isOutOfStock}
          >
            <ShoppingCartIcon className="h-4 w-4" aria-hidden />
          </IconActionButton>
        </div>
      </div>
    </article>
  );
}
