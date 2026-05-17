import { formatVND, discountPercent } from "@/src/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceTagProps {
  /** Current selling price (VND) */
  currentPrice: number;
  /** Original / list price — triggers strikethrough + discount badge */
  originalPrice?: number;
  /**
   * Explicit discount percentage to display.
   * If omitted, calculated automatically from currentPrice + originalPrice.
   */
  discountPct?: number;
  /**
   * Show an installment hint (e.g. "Only 625.000 ₫/month × 24 months").
   * @default false
   */
  showInstallment?: boolean;
  /** Number of installment months
   * @default 24
   */
  installmentMonths?: number;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const CURRENT_PRICE_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-base font-bold",
  md: "text-xl font-bold",
  lg: "text-2xl font-bold",
};

const ORIGINAL_PRICE_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PriceTag — formatted VND price with optional strikethrough original price,
 * discount badge, and installment hint.
 *
 * ```tsx
 * <PriceTag currentPrice={12900000} originalPrice={15900000} />
 * <PriceTag currentPrice={12900000} originalPrice={15900000} showInstallment />
 * <PriceTag currentPrice={990000} size="sm" />
 * ```
 */
export function PriceTag({
  currentPrice,
  originalPrice,
  discountPct,
  showInstallment = false,
  installmentMonths = 24,
  size = "md",
  className = "",
}: PriceTagProps) {
  const hasDiscount =
    originalPrice !== undefined && originalPrice > currentPrice;

  const resolvedDiscount =
    discountPct ??
    (hasDiscount ? discountPercent(currentPrice, originalPrice!) : 0);

  const installmentAmount =
    showInstallment && installmentMonths > 0
      ? Math.ceil(currentPrice / installmentMonths)
      : null;

  return (
    <div
      className={["flex flex-col gap-0.5", className].filter(Boolean).join(" ")}
    >
      {/* Current price row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`${CURRENT_PRICE_SIZE[size]} text-primary-700`}>
          {formatVND(currentPrice)}
        </span>

        {resolvedDiscount > 0 && (
          <span className="inline-flex items-center rounded bg-error-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            -{resolvedDiscount}%
          </span>
        )}
      </div>

      {/* Original price */}
      {hasDiscount && (
        <span
          className={`${ORIGINAL_PRICE_SIZE[size]} text-secondary-400 line-through`}
          aria-label={`Original price ${formatVND(originalPrice!)}`}
        >
          {formatVND(originalPrice!)}
        </span>
      )}

      {/* Installment hint */}
      {installmentAmount !== null && (
        <p className="text-xs text-secondary-500">
          Chỉ{" "}
          <span className="font-medium text-secondary-700">
            {formatVND(installmentAmount)}
          </span>
          /tháng × {installmentMonths} tháng
        </p>
      )}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name               Type             Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * currentPrice       number           required Current selling price (VND)
 * originalPrice      number           —        List price; enables strikethrough
 * discountPct        number           —        Override auto-calculated discount %
 * showInstallment    boolean          false    Show monthly installment hint
 * installmentMonths  number           24       Number of installment months
 * size               "sm"|"md"|"lg"   "md"     Text size scaling
 * className          string           ""       Extra classes on root div
 */
