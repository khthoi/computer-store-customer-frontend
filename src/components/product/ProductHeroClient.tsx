"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  BoltIcon,
  ShoppingCartIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/src/components/ui/Toast";
import { Button } from "@/src/components/ui/Button";
import { Alert } from "@/src/components/ui/Alert";
import { VariantSelector } from "@/src/components/product/VariantSelector";
import { PriceTag } from "@/src/components/product/PriceTag";
import { QuantityStepper } from "@/src/components/product/QuantityStepper";
import { ProductActionsBar } from "@/src/components/product/ProductActionsBar";
import { TrustBadgesRow } from "@/src/components/product/TrustBadgesRow";
import { StickyAddToCartBar } from "@/src/components/product/StickyAddToCartBar";
import { ContactModal } from "@/src/components/product/ContactModal";
import { formatVND } from "@/src/lib/format";
import type { ProductDetail, VariantGroup } from "@/src/components/product/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductHeroClientProps {
  product: ProductDetail;
  /** Slot: the rating stars button rendered in the right column */
  ratingSlot: ReactNode;
  thumbnailSrc: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computePrice(
  basePrice: number,
  variantGroups: VariantGroup[],
  selectedVariants: Record<string, string>
): number {
  let total = basePrice;
  for (const group of variantGroups) {
    const selectedValue = selectedVariants[group.key];
    if (!selectedValue) continue;
    const opt = group.options.find((o) => o.value === selectedValue);
    if (opt && typeof opt.priceDelta === "number") {
      total += opt.priceDelta;
    }
  }
  return total;
}

/** Returns true when the currently selected option in any group has stock === 0 */
function isVariantOutOfStock(
  variantGroups: VariantGroup[],
  selectedVariants: Record<string, string>
): boolean {
  return variantGroups.some((group) => {
    const val = selectedVariants[group.key];
    if (!val) return false;
    const opt = group.options.find((o) => o.value === val);
    return opt !== undefined && opt.stock === 0;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductHeroClient({
  product,
  ratingSlot,
  thumbnailSrc,
}: ProductHeroClientProps) {
  // Build default selections (first in-stock option per group)
  const buildDefaults = () => {
    const defaults: Record<string, string> = {};
    for (const group of product.variantGroups) {
      const firstInStock = group.options.find((o) => o.stock > 0);
      if (firstInStock) defaults[group.key] = firstInStock.value;
    }
    return defaults;
  };

  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >(buildDefaults);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const isOutOfStock = product.stockStatus === "out-of-stock";
  const isSelectedVariantOOS =
    !isOutOfStock && isVariantOutOfStock(product.variantGroups, selectedVariants);

  // Buttons disabled when product or selected variant has no stock
  const isCartDisabled = isOutOfStock || isSelectedVariantOOS;

  // Compute live price based on selected variants
  const computedPrice = computePrice(
    product.currentPrice,
    product.variantGroups,
    selectedVariants
  );

  // Flat variant options passed to ContactModal:
  // each VariantGroup option becomes one checkbox entry.
  const flatVariantOptions = product.variantGroups.flatMap((group) =>
    group.options.map((opt) => ({
      value: `${group.key}:${opt.value}`,
      label: group.options.length > 1
        ? `${group.label}: ${opt.label}`
        : opt.label,
    }))
  );

  // Pre-select whichever options are currently active in the selectors
  const defaultSelectedVariantValues = Object.entries(selectedVariants).map(
    ([key, val]) => `${key}:${val}`
  );

  const handleVariantChange = useCallback(
    (groupKey: string, value: string) => {
      setSelectedVariants((prev) => ({ ...prev, [groupKey]: value }));
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    if (isCartDisabled || isAddingToCart) return;
    setIsAddingToCart(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsAddingToCart(false);
    showToast("Đã thêm vào giỏ hàng!");
  }, [isCartDisabled, isAddingToCart, showToast]);

  const handleBuyNow = useCallback(async () => {
    if (isCartDisabled) return;
    await handleAddToCart();
    // In a real app: redirect to checkout
  }, [isCartDisabled, handleAddToCart]);

  const handleContactSuccess = useCallback(() => {
    showToast("Đã gửi yêu cầu! Chúng tôi sẽ liên hệ bạn sớm.", "success", 4000);
  }, [showToast]);

  return (
    <>
      {/* ── Right column content ── */}
      <div className="flex flex-col gap-4">

        {/* Brand(s) */}
        {product.brands.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.brands.map((b) => (
              <a
                key={b}
                href={`/products?brand=${encodeURIComponent(b)}`}
                className="inline-flex w-fit items-center rounded bg-secondary-100 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-600 hover:bg-secondary-200 transition-colors"
              >
                {b}
              </a>
            ))}
          </div>
        )}

        {/* Product name */}
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 leading-tight">
          {product.name}
        </h1>

        {/* SKU + Rating row */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-secondary-400 font-mono">
            SKU: {product.sku}
          </span>
          <span className="text-secondary-200" aria-hidden="true">|</span>
          {ratingSlot}
        </div>

        {/* Price */}
        <PriceTag
          currentPrice={computedPrice}
          originalPrice={
            computedPrice !== product.currentPrice
              ? undefined
              : product.originalPrice
          }
          discountPct={
            computedPrice !== product.currentPrice
              ? undefined
              : product.discountPct
          }
          showInstallment={!isCartDisabled}
          installmentMonths={12}
          size="lg"
        />

        {/* Stock badge rendered from server via slot — passed as prop in ProductHeroSection */}

        {/* Variant selectors */}
        {product.variantGroups.map((group) => (
          <VariantSelector
            key={group.key}
            label={group.label}
            type={group.type}
            options={group.options.map((opt) => ({
              value: opt.value,
              label: opt.label,
              stock: opt.stock,
              color: opt.color,
              priceDelta:
                typeof opt.priceDelta === "number" && opt.priceDelta > 0
                  ? `+${formatVND(opt.priceDelta)}`
                  : undefined,
            }))}
            value={selectedVariants[group.key]}
            onChange={(val) => handleVariantChange(group.key, val)}
          />
        ))}

        {/* Quantity stepper */}
        {!isCartDisabled && (
          <QuantityStepper
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={product.stockQuantity}
            disabled={false}
          />
        )}

        {/* Global out-of-stock alert */}
        {isOutOfStock && (
          <Alert variant="warning">
            Sản phẩm tạm hết hàng.
          </Alert>
        )}

        {/* Selected variant out-of-stock alert */}
        {isSelectedVariantOOS && (
          <Alert variant="warning">
            Cấu hình này hiện tạm hết hàng. Vui lòng chọn cấu hình khác hoặc đăng ký nhận thông tin.
          </Alert>
        )}

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col gap-3">
          <Button
            variant="danger"
            size="lg"
            fullWidth
            leftIcon={<BoltIcon className="w-5 h-5" />}
            disabled={isCartDisabled}
            onClick={handleBuyNow}
            className="active:scale-[0.98]"
          >
            Mua ngay
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<ShoppingCartIcon className="w-5 h-5" />}
            disabled={isCartDisabled}
            isLoading={isAddingToCart}
            onClick={handleAddToCart}
            className="active:scale-[0.98]"
          >
            Thêm vào giỏ hàng
          </Button>

          {/* Contact button — shown when product or selected variant is out-of-stock */}
          {isCartDisabled && (
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={<PhoneIcon className="w-5 h-5" />}
              onClick={() => setContactOpen(true)}
              className="active:scale-[0.98]"
            >
              Đăng ký nhận thông tin
            </Button>
          )}
        </div>

        {/* Wishlist + Compare + Share */}
        <ProductActionsBar
          productId={product.id}
          productName={product.name}
        />

        {/* Trust badges */}
        <TrustBadgesRow />
      </div>

      {/* Sticky add-to-cart bar (portals to fixed position) */}
      <StickyAddToCartBar
        productName={product.name}
        currentPrice={computedPrice}
        thumbnailSrc={thumbnailSrc}
        thumbnailAlt={product.name}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        isAddingToCart={isAddingToCart}
        ctaRef={ctaRef}
      />

      {/* Contact modal */}
      <ContactModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        productName={product.name}
        variantOptions={flatVariantOptions}
        defaultSelectedVariants={defaultSelectedVariantValues}
        onSuccess={handleContactSuccess}
      />

    </>
  );
}
