"use client";

import { useCallback } from "react";
import {
  XMarkIcon,
  ScaleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { formatVND } from "@/src/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareProduct {
  id: string;
  name: string;
  thumbnail: string;
  price: number;
}

export interface CompareBarProps {
  /** Products currently selected for comparison (2–maxProducts) */
  products: CompareProduct[];
  /** Called when the user removes a product from the comparison */
  onRemove: (id: string) => void;
  /** Called when the user clicks "Compare Now" */
  onCompare: () => void;
  /**
   * Maximum number of products that can be compared.
   * @default 3
   */
  maxProducts?: number;
  /**
   * Controls visibility of the bar.
   * The bar also auto-hides when products array is empty.
   */
  isOpen?: boolean;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareBar — sticky bottom bar showing 2–3 selected products
 * with remove controls and a "Compare Now" button.
 *
 * ```tsx
 * <CompareBar
 *   products={compareList}
 *   onRemove={(id) => removeFromCompare(id)}
 *   onCompare={() => router.push("/compare")}
 *   isOpen={compareList.length >= 1}
 * />
 * ```
 */
export function CompareBar({
  products,
  onRemove,
  onCompare,
  maxProducts = 3,
  isOpen = true,
  className = "",
}: CompareBarProps) {
  const handleRemove = useCallback(
    (id: string) => (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove(id);
    },
    [onRemove]
  );

  const visible = isOpen && products.length > 0;
  const canCompare = products.length >= 2;
  const slotsLeft = maxProducts - products.length;

  return (
    <div
      role="region"
      aria-label="Product comparison"
      aria-hidden={!visible}
      className={[
        "fixed bottom-0 left-0 right-0 z-40 border-t border-secondary-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "translate-y-full",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex w-full items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Label */}
        <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-secondary-700">
          <ScaleIcon className="w-5 h-5 text-primary-600" aria-hidden="true" />
          <span className="hidden sm:inline">Compare</span>
          <span className="text-secondary-400">
            ({products.length}/{maxProducts})
          </span>
        </div>

        {/* Product slots */}
        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          {/* Filled product slots */}
          {products.map((product) => (
            <div
              key={product.id}
              className="relative flex shrink-0 items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 pl-2 pr-7 py-1.5 max-w-[200px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnail}
                alt={product.name}
                className="h-10 w-10 shrink-0 rounded object-contain"
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-secondary-800 max-w-[120px]">
                  {product.name}
                </p>
                <p className="text-xs font-semibold text-primary-700">
                  {formatVND(product.price)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${product.name} from comparison`}
                onClick={handleRemove(product.id)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-secondary-400 transition-colors hover:bg-secondary-200 hover:text-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <XMarkIcon className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {slotsLeft > 0 &&
            Array.from({ length: slotsLeft }, (_, i) => (
              <div
                key={`empty-${i}`}
                aria-hidden="true"
                className="flex h-14 w-[160px] shrink-0 items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-secondary-200 text-xs text-secondary-400"
              >
                <PlusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                Add product
              </div>
            ))}
        </div>

        {/* Compare button */}
        <button
          type="button"
          disabled={!canCompare}
          onClick={onCompare}
          className={[
            "shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150",
            canCompare
              ? "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm"
              : "cursor-not-allowed bg-secondary-100 text-secondary-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
          ].join(" ")}
        >
          Compare Now
        </button>
      </div>
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name         Type                      Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * products     CompareProduct[]          required Selected products (2–maxProducts)
 * onRemove     (id: string) => void      required Remove product callback
 * onCompare    () => void                required "Compare Now" click callback
 * maxProducts  number                    3        Max comparison slots
 * isOpen       boolean                   true     Controls bar visibility
 * className    string                    ""       Extra classes on root div
 *
 * ─── CompareProduct ───────────────────────────────────────────────────────────
 *
 * Name       Type    Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * id         string  yes       Unique product identifier
 * name       string  yes       Product name (truncated in slot)
 * thumbnail  string  yes       Thumbnail image URL
 * price      number  yes       Current price (VND)
 */
