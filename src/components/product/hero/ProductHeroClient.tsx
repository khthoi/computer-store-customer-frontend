"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BoltIcon,
  ShoppingCartIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useToast } from "@/src/components/ui/Toast";
import { Button } from "@/src/components/ui/Button";
import { Alert } from "@/src/components/ui/Alert";
import { VariantSelector } from "@/src/components/product/variants/VariantSelector";
import { PriceTag } from "@/src/components/product/atoms/PriceTag";
import { QuantityStepper } from "@/src/components/product/atoms/QuantityStepper";
import { ProductActionsBar } from "@/src/components/product/actions/ProductActionsBar";
import { StickyAddToCartBar } from "@/src/components/product/actions/StickyAddToCartBar";
import { ContactModal } from "@/src/components/product/actions/ContactModal";
import { formatVND } from "@/src/lib/format";
import { addCartItem } from "@/src/services/cart.service";
import { useAuth } from "@/src/store/auth.store";
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
  // Read ?variant=<id> from URL — when navigated from search/quick suggestion,
  // pre-select that variant so price/stock/specs reflect the user's choice.
  const searchParams = useSearchParams();
  const requestedVariantId = searchParams?.get("variant") ?? null;

  // Build default selections: prefer ?variant= match, else first in-stock per group
  const buildDefaults = () => {
    const defaults: Record<string, string> = {};
    for (const group of product.variantGroups) {
      const requested = requestedVariantId
        ? group.options.find((o) => o.value === requestedVariantId)
        : undefined;
      if (requested) {
        defaults[group.key] = requested.value;
        continue;
      }
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
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const router = useRouter();
  const { state: authState, openModal: openAuthModal } = useAuth();
  const isLoggedIn = authState.status === "authenticated";

  // Resolve the currently selected variant id. Our backend exposes variants
  // under a single group keyed "variant" (see buildVariantGroup in the service),
  // so the value of that key is the variant id. As a fallback we pick the first
  // group's selection.
  const selectedVariantId = useMemo<number | null>(() => {
    const raw =
      selectedVariants["variant"] ??
      Object.values(selectedVariants)[0] ??
      null;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selectedVariants]);

  // Find the currently-selected variant option (whole object) once so stock,
  // warranty, and other per-variant details stay in sync.
  const selectedVariantOption = useMemo(() => {
    const group = product.variantGroups.find((g) => g.key === "variant")
      ?? product.variantGroups[0];
    if (!group) return null;
    const val = selectedVariants[group.key];
    return group.options.find((o) => o.value === val) ?? null;
  }, [product.variantGroups, selectedVariants]);

  const selectedVariantStock = typeof selectedVariantOption?.stock === "number"
    ? selectedVariantOption.stock
    : product.stockQuantity;

  const selectedWarrantyMonths = selectedVariantOption?.warrantyMonths ?? null;

  // Broadcast variant change so other sections (e.g. tabs) can react.
  useEffect(() => {
    if (!selectedVariantOption) return;
    window.dispatchEvent(
      new CustomEvent("selectedVariantChange", {
        detail: {
          id: selectedVariantOption.value,
          warrantyMonths: selectedVariantOption.warrantyMonths ?? null,
          warrantyPolicy: selectedVariantOption.warrantyPolicy ?? null,
        },
      }),
    );
  }, [selectedVariantOption]);

  // Clamp quantity when variant changes (e.g. user picks a variant with lower stock)
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, Math.max(selectedVariantStock, 1))));
  }, [selectedVariantStock]);

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

  const requireLogin = useCallback(
    (redirectTo: string) => {
      if (isLoggedIn) return true;
      openAuthModal("login", redirectTo);
      showToast("Vui lòng đăng nhập để tiếp tục.", "info");
      return false;
    },
    [isLoggedIn, openAuthModal, showToast],
  );

  const handleAddToCart = useCallback(async (): Promise<boolean> => {
    if (isCartDisabled || isAddingToCart || isBuyingNow) return false;
    if (!selectedVariantId) {
      showToast("Vui lòng chọn phiên bản sản phẩm.", "error");
      return false;
    }
    if (quantity < 1 || quantity > selectedVariantStock) {
      showToast(
        `Số lượng vượt quá tồn kho (còn ${selectedVariantStock}).`,
        "error",
      );
      return false;
    }
    if (!requireLogin(`/products/${product.slug}`)) return false;

    setIsAddingToCart(true);
    try {
      await addCartItem(selectedVariantId, quantity);
      showToast("Đã thêm vào giỏ hàng!", "success");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể thêm vào giỏ hàng.";
      showToast(message, "error");
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    isCartDisabled,
    isAddingToCart,
    isBuyingNow,
    selectedVariantId,
    quantity,
    selectedVariantStock,
    requireLogin,
    product.slug,
    showToast,
  ]);

  const handleBuyNow = useCallback(async () => {
    if (isCartDisabled || isBuyingNow) return;
    setIsBuyingNow(true);
    try {
      const ok = await handleAddToCart();
      if (ok) router.push("/checkout");
    } finally {
      setIsBuyingNow(false);
    }
  }, [isCartDisabled, isBuyingNow, handleAddToCart, router]);

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

        {/* Warranty line (per-variant) */}
        {selectedWarrantyMonths != null && selectedWarrantyMonths > 0 && (
          <div className="text-xs text-secondary-600">
            Bảo hành: <span className="font-medium text-secondary-800">{selectedWarrantyMonths} tháng</span>
          </div>
        )}

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
            max={selectedVariantStock}
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
            disabled={isCartDisabled || isAddingToCart}
            isLoading={isBuyingNow}
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
            disabled={isCartDisabled || isBuyingNow}
            isLoading={isAddingToCart}
            onClick={() => void handleAddToCart()}
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
          productSlug={product.slug}
          variantId={selectedVariantId}
        />
      </div>

      {/* Sticky add-to-cart bar (portals to fixed position) */}
      <StickyAddToCartBar
        productName={product.name}
        currentPrice={computedPrice}
        thumbnailSrc={thumbnailSrc}
        thumbnailAlt={product.name}
        onAddToCart={() => void handleAddToCart()}
        onBuyNow={() => void handleBuyNow()}
        isAddingToCart={isAddingToCart || isBuyingNow}
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
