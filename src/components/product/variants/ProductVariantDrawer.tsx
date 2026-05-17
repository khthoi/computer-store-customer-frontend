"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Drawer } from "@/src/components/ui/Drawer";
import { VariantSelector } from "@/src/components/product/variants/VariantSelector";
import type { VariantOption } from "@/src/components/product/variants/VariantSelector";
import { PriceTag } from "@/src/components/product/atoms/PriceTag";
import {
  ShoppingCartIcon,
  ArrowsRightLeftIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantGroup {
  /** Unique key matching the variant dimension, e.g. "ram", "storage", "color" */
  key: string;
  /** Display label shown above the options, e.g. "RAM", "Dung lượng" */
  label: string;
  /** Button chips (default) or circular color swatches */
  type?: "button" | "color";
  options: VariantOption[];
}

export type DrawerActionType = "wishlist" | "compare" | "cart";

export interface ProductVariantDrawerProduct {
  id: string;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
}

export interface ProductVariantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductVariantDrawerProduct;
  /** Which action the user triggered */
  actionType: DrawerActionType;
  /** Optional variant groups — shown as selector rows */
  variants?: VariantGroup[];
  /**
   * Called when the user confirms the action.
   * Receives a map of { [group.key]: selectedOptionValue } and the chosen
   * quantity (only meaningful when actionType === "cart"; 1 otherwise).
   */
  onConfirm: (selectedVariants: Record<string, string>, quantity: number) => void;
}

// ─── Action config ────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<
  DrawerActionType,
  { label: string; Icon: React.ElementType; buttonClass: string }
> = {
  cart: {
    label: "Thêm vào giỏ hàng",
    Icon: ShoppingCartIcon,
    buttonClass:
      "bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white",
  },
  compare: {
    label: "Thêm vào so sánh",
    Icon: ArrowsRightLeftIcon,
    buttonClass:
      "bg-secondary-800 hover:bg-secondary-900 active:bg-secondary-950 text-white",
  },
  wishlist: {
    label: "Thêm vào yêu thích",
    Icon: HeartIcon,
    buttonClass: "bg-error-500 hover:bg-error-600 active:bg-error-700 text-white",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductVariantDrawer — bottom sheet for selecting product variants before
 * executing a cart / compare / wishlist action.
 *
 * ```tsx
 * <ProductVariantDrawer
 *   isOpen={drawerOpen}
 *   onClose={() => setDrawerOpen(false)}
 *   product={{ id, name, brand, thumbnail, price, originalPrice }}
 *   actionType="cart"
 *   variants={[
 *     { key: "ram",     label: "RAM",     options: ramOptions },
 *     { key: "storage", label: "Bộ nhớ", options: storageOptions },
 *   ]}
 *   onConfirm={(selected) => addToCart(id, selected)}
 * />
 * ```
 */
export const ProductVariantDrawer = memo(function ProductVariantDrawer({
  isOpen,
  onClose,
  product,
  actionType,
  variants = [],
  onConfirm,
}: ProductVariantDrawerProps) {
  const computeDefaultSelection = useCallback(
    (groups: VariantGroup[]): Record<string, string> => {
      const next: Record<string, string> = {};
      for (const group of groups) {
        const def =
          group.options.find((o) => o.isDefault) ?? group.options[0];
        if (def) next[group.key] = def.value;
      }
      return next;
    },
    [],
  );

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    computeDefaultSelection(variants),
  );
  const [quantity, setQuantity] = useState(1);

  // Re-seed default selection whenever the drawer is (re)opened or when the
  // variant list itself changes. Without this, switching cards while the
  // drawer is mounted would keep stale selection state.
  useEffect(() => {
    if (isOpen) {
      setSelected(computeDefaultSelection(variants));
      setQuantity(1);
    }
  }, [isOpen, variants, computeDefaultSelection]);

  const handleSelect = useCallback((key: string, value: string) => {
    setSelected((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(selected, actionType === "cart" ? quantity : 1);
    onClose();
    setSelected(computeDefaultSelection(variants));
    setQuantity(1);
  }, [onConfirm, selected, quantity, actionType, onClose, variants, computeDefaultSelection]);

  const handleClose = useCallback(() => {
    setSelected(computeDefaultSelection(variants));
    setQuantity(1);
    onClose();
  }, [onClose, variants, computeDefaultSelection]);

  const { label: actionLabel, Icon: ActionIcon, buttonClass } =
    ACTION_CONFIG[actionType];

  // ── Derive preview (price / originalPrice / thumbnail) from selected option ──
  // Falls back to the product-level values when no variant is selected yet, or
  // when the selected option carries no per-variant data.
  const selectedOption = (() => {
    for (const group of variants) {
      const value = selected[group.key];
      if (!value) continue;
      const opt = group.options.find((o) => o.value === value);
      if (opt) return opt;
    }
    return undefined;
  })();

  const displayPrice =
    selectedOption?.price != null ? selectedOption.price : product.price;
  const displayOriginalPrice = selectedOption
    ? selectedOption.originalPrice != null &&
      selectedOption.originalPrice > (selectedOption.price ?? 0)
      ? selectedOption.originalPrice
      : undefined
    : product.originalPrice;
  const displayThumbnail =
    selectedOption?.thumbnailUrl && selectedOption.thumbnailUrl.length > 0
      ? selectedOption.thumbnailUrl
      : product.thumbnail;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      position="right"
      size="xl"
      closeOnBackdrop
      title={
        actionType === "cart"
          ? "Chọn cấu hình"
          : actionType === "compare"
          ? "So sánh sản phẩm"
          : "Thêm vào yêu thích"
      }
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-secondary-200 px-4 py-3 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={[
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-400",
              buttonClass,
            ].join(" ")}
          >
            <ActionIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      }
    >
      {/* ── Product preview ── */}
      <div className="flex items-center gap-4 pb-4 border-b border-secondary-100">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-secondary-100 bg-secondary-50 p-2">
          <img
            src={displayThumbnail}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block mb-1 rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-600">
            {product.brand}
          </span>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-secondary-900">
            {product.name}
          </p>
          <PriceTag
            currentPrice={displayPrice}
            originalPrice={displayOriginalPrice}
            size="sm"
            className="mt-1"
          />
        </div>
      </div>

      {/* ── Quantity stepper (cart only) ── */}
      {actionType === "cart" && (() => {
        const maxStock = typeof selectedOption?.stock === "number" && selectedOption.stock > 0
          ? selectedOption.stock
          : 99;
        const canDecrease = quantity > 1;
        const canIncrease = quantity < maxStock;
        return (
          <div className="mt-5 flex items-center justify-between gap-4 border-b border-secondary-100 pb-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
                Số lượng
              </p>
              {typeof selectedOption?.stock === "number" && (
                <p className="mt-0.5 text-xs text-secondary-500">
                  Tồn kho: {selectedOption.stock}
                </p>
              )}
            </div>
            <div className="inline-flex items-center gap-0 rounded-lg border border-secondary-200 overflow-hidden">
              <button
                type="button"
                onClick={() => canDecrease && setQuantity((q) => q - 1)}
                disabled={!canDecrease}
                aria-label="Giảm số lượng"
                className="flex h-10 w-10 items-center justify-center text-secondary-700 hover:bg-secondary-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MinusIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <input
                type="number"
                min={1}
                max={maxStock}
                value={quantity}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n)) return;
                  setQuantity(Math.min(maxStock, Math.max(1, Math.floor(n))));
                }}
                className="w-12 h-10 text-center text-sm font-semibold text-secondary-900 border-x border-secondary-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Số lượng"
              />
              <button
                type="button"
                onClick={() => canIncrease && setQuantity((q) => q + 1)}
                disabled={!canIncrease}
                aria-label="Tăng số lượng"
                className="flex h-10 w-10 items-center justify-center text-secondary-700 hover:bg-secondary-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Variant selectors ── */}
      {variants.length > 0 ? (
        <div className="mt-5 flex flex-col gap-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
            Chọn cấu hình
          </p>
          {variants.map((group) => (
            <VariantSelector
              key={group.key}
              label={group.label}
              type={group.type ?? "button"}
              options={group.options}
              value={selected[group.key]}
              onChange={(val) => handleSelect(group.key, val)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-secondary-500">
          Xác nhận thao tác với sản phẩm này.
        </p>
      )}
    </Drawer>
  );
});
