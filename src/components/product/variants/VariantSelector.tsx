"use client";

import { useCallback, type ReactNode } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantOption {
  /** Unique identifier */
  value: string;
  /** Display label (e.g. "16 GB", "512 GB SSD", "Midnight Black") */
  label: string;
  /**
   * Available stock for this variant.
   * 0 = out-of-stock (button is disabled + strikethrough).
   */
  stock: number;
  /**
   * For type="color" — CSS color value or Tailwind-compatible hex string
   * (rendered as an inline background-color swatch).
   */
  color?: string;
  /** Optional price delta label (e.g. "+500.000 ₫") */
  priceDelta?: ReactNode;
  /** Sale price of this specific variant (used by drawer preview to swap price on selection) */
  price?: number;
  /** Original (pre-discount) price of this variant; rendered with strikethrough when greater than price */
  originalPrice?: number;
  /** Main media URL for this variant; drawer preview swaps thumbnail when this variant is selected */
  thumbnailUrl?: string | null;
  /** Marks this option as the product's default variant; drawer pre-selects it on open */
  isDefault?: boolean;
}

export interface VariantSelectorProps {
  /** Label shown above the buttons (e.g. "RAM", "Storage", "Color") */
  label?: string;
  options: VariantOption[];
  /** Currently selected value */
  value?: string;
  /** Called when the user selects a variant */
  onChange?: (value: string) => void;
  /**
   * "button" — text label chips.
   * "color"  — circular color swatches.
   * @default "button"
   */
  type?: "button" | "color";
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * VariantSelector — RAM / SSD / color option buttons with stock awareness.
 *
 * ```tsx
 * <VariantSelector
 *   label="RAM"
 *   type="button"
 *   options={[
 *     { value: "16gb",  label: "16 GB",  stock: 10 },
 *     { value: "32gb",  label: "32 GB",  stock: 3 },
 *     { value: "64gb",  label: "64 GB",  stock: 0 },
 *   ]}
 *   value={ram}
 *   onChange={setRam}
 * />
 *
 * <VariantSelector
 *   label="Color"
 *   type="color"
 *   options={[
 *     { value: "black", label: "Midnight Black", color: "#1a1a1a", stock: 5 },
 *     { value: "white", label: "Arctic White",   color: "#f5f5f5", stock: 2 },
 *   ]}
 *   value={color}
 *   onChange={setColor}
 * />
 * ```
 */
export function VariantSelector({
  label,
  options,
  value,
  onChange,
  type = "button",
  className = "",
}: VariantSelectorProps) {
  const handleSelect = useCallback(
    (optValue: string, stock: number) => {
      if (stock <= 0) return;
      onChange?.(optValue);
    },
    [onChange]
  );

  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-secondary-700">{label}</span>
          {value && (
            <span className="text-sm text-secondary-500">
              {options.find((o) => o.value === value)?.label}
            </span>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          const isOutOfStock = opt.stock <= 0;

          if (type === "color") {
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${opt.label}${isOutOfStock ? " (out of stock)" : ""}`}
                disabled={isOutOfStock}
                onClick={() => handleSelect(opt.value, opt.stock)}
                className={[
                  "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-150",
                  isSelected
                    ? "border-primary-600 ring-2 ring-primary-200"
                    : "border-transparent hover:border-secondary-300",
                  isOutOfStock ? "cursor-not-allowed opacity-40" : "cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                ].join(" ")}
              >
                <span
                  className="h-6 w-6 rounded-full border border-secondary-200"
                  style={{ backgroundColor: opt.color ?? "#ccc" }}
                  aria-hidden="true"
                />
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <CheckIcon
                      className="w-3.5 h-3.5 drop-shadow-sm"
                      style={{
                        color: opt.color
                          ? isLightColor(opt.color)
                            ? "#000"
                            : "#fff"
                          : "#fff",
                      }}
                      aria-hidden="true"
                    />
                  </span>
                )}
              </button>
            );
          }

          // type === "button"
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${opt.label}${isOutOfStock ? " (out of stock)" : ""}`}
              disabled={isOutOfStock}
              onClick={() => handleSelect(opt.value, opt.stock)}
              className={[
                "relative flex flex-col items-center justify-center rounded-md border px-3 py-2 text-sm transition-all duration-150",
                isSelected
                  ? "border-primary-600 bg-primary-50 text-primary-700 font-semibold ring-1 ring-primary-400"
                  : isOutOfStock
                  ? "border-secondary-200 bg-secondary-50 text-secondary-400 cursor-not-allowed"
                  : "border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 hover:bg-primary-50 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              ].join(" ")}
            >
              <span className={isOutOfStock ? "line-through opacity-60" : ""}>
                {opt.label}
              </span>
              {opt.priceDelta && (
                <span className="text-[10px] text-secondary-500 font-normal mt-0.5">
                  {opt.priceDelta}
                </span>
              )}
              {isOutOfStock && (
                <span
                  className="absolute inset-0 rounded-md"
                  aria-hidden="true"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 5px)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Naïve luminance check so the checkmark is readable on both light/dark swatches. */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Perceived luminance (ITU-R BT.601)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name       Type                      Default   Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label      string                    —         Group label (e.g. "RAM")
 * options    VariantOption[]           required  Option definitions
 * value      string                    —         Controlled selected value
 * onChange   (value: string) => void   —         Selection callback
 * type       "button"|"color"          "button"  Chip style
 * className  string                    ""        Extra classes on root div
 *
 * ─── VariantOption ────────────────────────────────────────────────────────────
 *
 * Name        Type       Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * value       string     yes       Unique identifier
 * label       string     yes       Display text
 * stock       number     yes       Available quantity (0 = disabled)
 * color       string     no        CSS color for type="color" swatch
 * priceDelta  ReactNode  no        Price difference hint (e.g. "+200.000 ₫")
 */
