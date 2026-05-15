"use client";

import { memo, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ShoppingCartIcon,
  HeartIcon,
  ArrowsRightLeftIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { ContactModal } from "./ContactModal";
import { ToastMessage } from "@/src/components/ui/Toast";
import { RatingStars } from "./RatingStars";
import { StockBadge, type StockStatus } from "./StockBadge";
import { PriceTag } from "./PriceTag";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { Badge } from "@/src/components/ui/Badge";
import type {
  VariantGroup,
  DrawerActionType,
} from "./ProductVariantDrawer";

// Lazy-load the drawer — excluded from the initial bundle
const ProductVariantDrawer = dynamic(
  () =>
    import("./ProductVariantDrawer").then((m) => ({
      default: m.ProductVariantDrawer,
    })),
  { ssr: false }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  /** Product detail page URL */
  href: string;
  thumbnail: string;
  thumbnailAlt?: string;
  /** Promotional overlay label, e.g. "Hot", "Sale", "New" */
  badge?: string;
  /** Key-specs / product-code line shown below the name — one line, ellipsis */
  productCode?: string;
  /** Current selling price (VND) */
  price: number;
  /** Original list price — shows strikethrough + discount badge */
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: StockStatus;
  stockQuantity?: number;
  /** Variant groups shown in the bottom drawer before any action executes */
  variants?: VariantGroup[];
  /** Show the product as wishlisted */
  isWishlisted?: boolean;
  onAddToCart?: (id: string, selectedVariants: Record<string, string>) => void;
  onCompare?: (id: string, selectedVariants: Record<string, string>) => void;
  onWishlistToggle?: (id: string, wishlisted: boolean, selectedVariants: Record<string, string>) => void;
  /**
   * Layout variant.
   * - `"grid"` — vertical card (default)
   * - `"list"` — horizontal row layout
   */
  variant?: "grid" | "list";
  className?: string;
}

// ─── Icon action button ────────────────────────────────────────────────────────

interface IconActionButtonProps {
  label?: string;
  onClick: (e: React.MouseEvent) => void;
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
 * ProductCard — fixed-section layout for carousel alignment.
 *
 * 6 sections, each reserves height regardless of content:
 *   1. Image        — h-[180px] fixed
 *   2. Meta         — brand + name (min-h-[4.5rem] = 3 lines) + productCode (min-h-[1rem])
 *   3. Rating       — min-h-[20px], empty div when no rating
 *   4. Price        — min-h-[48px], invisible placeholder row when no originalPrice
 *   5. Stock        — min-h-[32px]
 *   6. Action row   — mt-auto, always pinned to card bottom
 */
export const ProductCard = memo(function ProductCard({
  id,
  name,
  brand,
  href,
  thumbnail,
  thumbnailAlt,
  badge,
  productCode,
  price,
  originalPrice,
  rating,
  reviewCount,
  stockStatus = "in-stock",
  stockQuantity,
  variants,
  isWishlisted = false,
  onAddToCart,
  onCompare,
  onWishlistToggle,
  variant = "grid",
  className = "",
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerAction, setDrawerAction] = useState<DrawerActionType>("cart");
  // Keep drawer in the React tree after first open so the close animation
  // can complete before Drawer.tsx unmounts its own portal.
  const [drawerEverOpened, setDrawerEverOpened] = useState(false);

  const isOutOfStock = stockStatus === "out-of-stock";

  // ── Open drawer with the given action type ──────────────────────────────────

  const openDrawer = useCallback(
    (e: React.MouseEvent, action: DrawerActionType) => {
      e.preventDefault();
      e.stopPropagation();
      setDrawerAction(action);
      setDrawerEverOpened(true);
      setDrawerOpen(true);
    },
    []
  );

  const handleWishlistClick = useCallback(
    (e: React.MouseEvent) => openDrawer(e, "wishlist"),
    [openDrawer]
  );

  const handleCompareClick = useCallback(
    (e: React.MouseEvent) => openDrawer(e, "compare"),
    [openDrawer]
  );

  const handleCartClick = useCallback(
    (e: React.MouseEvent) => {
      if (isOutOfStock) return;
      openDrawer(e, "cart");
    },
    [isOutOfStock, openDrawer]
  );

  // ── Drawer confirm — executes the actual action ─────────────────────────────

  const handleConfirm = useCallback(
    (selectedVariants: Record<string, string>) => {
      if (drawerAction === "cart") {
        onAddToCart?.(id, selectedVariants);
      } else if (drawerAction === "compare") {
        onCompare?.(id, selectedVariants);
      } else {
        const next = !wishlisted;
        setWishlisted(next);
        onWishlistToggle?.(id, next, selectedVariants);
      }
    },
    [drawerAction, id, wishlisted, onAddToCart, onCompare, onWishlistToggle]
  );

  // ── Contact modal + toast ────────────────────────────────────────────────────

  const [contactOpen, setContactOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const handleContactClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContactOpen(true);
  }, []);

  const handleContactSuccess = useCallback(() => {
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  // ── List variant ─────────────────────────────────────────────────────────────

  if (variant === "list") {
    return (
      <>
        <article
          className={[
            "flex gap-4 rounded-xl border border-secondary-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* Image */}
          <a
            href={href}
            aria-label={name}
            tabIndex={-1}
            aria-hidden="true"
            className="relative block h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-secondary-50"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={thumbnailAlt ?? name}
                className="h-full w-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-full w-full items-center justify-center text-[10px] text-secondary-400"
              >
                Không có ảnh
              </div>
            )}
            {badge && (
              <span className="absolute left-1 top-1 rounded bg-error-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
                {badge}
              </span>
            )}
          </a>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {/* Brand + meta row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex w-fit items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-600">
                {brand}
              </span>
              {rating !== undefined && (
                <RatingStars value={rating} count={reviewCount} size="sm" />
              )}
              {productCode && (
                <Badge
                  variant="default"
                  size="sm"
                  className="font-mono tracking-wide min-w-0 max-w-[12rem]"
                >
                  <span className="block truncate" title={productCode}>
                    {productCode}
                  </span>
                </Badge>
              )}
            </div>

            {/* Name */}
            <Tooltip content={name} placement="top-start">
              <a
                href={href}
                className="line-clamp-2 text-sm font-semibold text-secondary-900 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                {name}
              </a>
            </Tooltip>

            {/* Price — pushed to bottom */}
            <div className="mt-auto pt-1">
              <PriceTag currentPrice={price} originalPrice={originalPrice} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col items-end justify-between">
            <StockBadge status={stockStatus} quantity={stockQuantity} size="sm" />
            <div className="flex gap-2">
              <IconActionButton label="So sánh" onClick={handleCompareClick}>
                <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
              </IconActionButton>
              {isOutOfStock && (
                <IconActionButton label="Liên hệ" onClick={handleContactClick}>
                  <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                </IconActionButton>
              )}
              <IconActionButton
                label={wishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                onClick={handleWishlistClick}
                active={wishlisted}
              >
                {wishlisted ? (
                  <HeartSolidIcon className="h-4 w-4 text-error-500" aria-hidden="true" />
                ) : (
                  <HeartIcon className="h-4 w-4" aria-hidden="true" />
                )}
              </IconActionButton>
              <IconActionButton
                label={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
                onClick={handleCartClick}
                disabled={isOutOfStock}
              >
                <ShoppingCartIcon className="h-4 w-4" aria-hidden="true" />
              </IconActionButton>
            </div>
          </div>
        </article>

        {drawerEverOpened && (
          <ProductVariantDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            product={{ id, name, brand, thumbnail, price, originalPrice }}
            actionType={drawerAction}
            variants={variants}
            onConfirm={handleConfirm}
          />
        )}

        <ContactModal
          isOpen={contactOpen}
          onClose={() => setContactOpen(false)}
          productName={name}
          onSuccess={handleContactSuccess}
        />

        <ToastMessage
          isVisible={toastVisible}
          type="success"
          message="Đã đăng ký nhận thông tin liên hệ!"
          position="top-right"
          onClose={() => setToastVisible(false)}
        />
      </>
    );
  }

  // ── Grid variant (default) ────────────────────────────────────────────────────

  return (
    <>
      <article
        className={[
          "group relative flex h-full min-h-[420px] flex-col mb-2 overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* ── 1. Image Section — fixed h-[180px] ── */}
        <a
          href={href}
          aria-label={name}
          className="relative block h-[180px] shrink-0 overflow-hidden bg-secondary-50"
          tabIndex={-1}
          aria-hidden="true"
        >
          <div className="flex h-full items-center justify-center">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={thumbnailAlt ?? name}
                className="max-h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <span aria-hidden="true" className="text-xs text-secondary-400">
                Không có ảnh
              </span>
            )}
          </div>

          {/* Promo badge */}
          {badge && (
            <span className="absolute left-2 top-2 rounded bg-error-500 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
              {badge}
            </span>
          )}

          {/* Wishlist overlay button */}
          <button
            type="button"
            aria-label={wishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            aria-pressed={wishlisted}
            onClick={handleWishlistClick}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-secondary-400 shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-white hover:text-error-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {wishlisted ? (
              <HeartSolidIcon className="h-4 w-4 text-error-500" aria-hidden="true" />
            ) : (
              <HeartIcon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </a>

        {/* ── Content ── */}
        <div className="flex flex-1 flex-col p-3">

          {/* ── 2. Meta Section ── */}
          <div className="flex flex-col gap-1.5">
            {/* Brand badge — always reserves height even when brand is empty */}
            <div className="flex min-h-[18px] items-center">
              {brand ? (
                <span className="inline-flex w-fit items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-600">
                  {brand}
                </span>
              ) : (
                <span aria-hidden="true" className="inline-block h-[18px]" />
              )}
            </div>

            {/* Product name — clamped to exactly 3 lines; min-h/max-h lock the row height */}
            <Tooltip content={name} placement="top">
              <a
                href={href}
                className="line-clamp-3 h-[4.2em] overflow-hidden leading-[1.4] text-sm font-medium text-secondary-900 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                {name}
              </a>
            </Tooltip>

            {/* Product code badge — min-h-[20px] reserves space when absent */}
            <div className="flex min-h-[20px] min-w-0 items-center">
              {productCode && (
                <Badge
                  variant="default"
                  size="sm"
                  className="font-mono tracking-wide min-w-0 max-w-full"
                >
                  <span className="block truncate" title={productCode}>
                    {productCode}
                  </span>
                </Badge>
              )}
            </div>
          </div>

          {/* ── 3. Rating Section — always reserves 20px ── */}
          <div className="mt-2 flex min-h-[20px] items-center">
            {rating !== undefined && (
              <RatingStars value={rating} count={reviewCount} size="sm" />
            )}
          </div>

          {/* ── 4. Price Section — always reserves 48px ── */}
          <div className="mt-2 min-h-[48px]">
            <PriceTag
              currentPrice={price}
              originalPrice={originalPrice}
              size="sm"
            />
            {/* Invisible placeholder preserves 2nd-row height when no discount */}
            {!originalPrice && (
              <span className="select-none opacity-0 text-xs" aria-hidden="true">
                placeholder
              </span>
            )}
          </div>

          {/* ── 5. Stock Section — always reserves 32px ── */}
          <div className="mt-1 flex min-h-[32px] items-center">
            <StockBadge status={stockStatus} quantity={stockQuantity} size="sm" />
          </div>

          {/* ── 6. Action Buttons — pinned to card bottom via mt-auto ── */}
          <div className="mt-auto flex items-center justify-end gap-2 border-t border-secondary-100 pt-2">
            <IconActionButton label="So sánh" onClick={handleCompareClick}>
              <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
            </IconActionButton>

            {isOutOfStock && (
              <IconActionButton label="Liên hệ" onClick={handleContactClick}>
                <PhoneIcon className="h-4 w-4" aria-hidden="true" />
              </IconActionButton>
            )}

            <IconActionButton
              label={isOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
              onClick={handleCartClick}
              disabled={isOutOfStock}
            >
              <ShoppingCartIcon className="h-4 w-4" aria-hidden="true" />
            </IconActionButton>
          </div>
        </div>
      </article>

      {/* Lazy drawer — mounted on first click, then kept alive so the
          close animation (300 ms slide-out) can finish before Drawer.tsx
          unmounts its own portal. isOpen drives animation, not mounting. */}
      {drawerEverOpened && (
        <ProductVariantDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          product={{ id, name, brand, thumbnail, price, originalPrice }}
          actionType={drawerAction}
          variants={variants}
          onConfirm={handleConfirm}
        />
      )}

      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        productName={name}
        onSuccess={handleContactSuccess}
      />

      <ToastMessage
        isVisible={toastVisible}
        type="success"
        message="Đã đăng ký nhận thông tin liên hệ!"
        position="top-right"
        onClose={() => setToastVisible(false)}
      />
    </>
  );
});
