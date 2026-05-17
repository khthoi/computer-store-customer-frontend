import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface StockBadgeProps {
  status: StockStatus;
  /**
   * Show the remaining quantity (only meaningful for "low-stock").
   * Ignored when status is "in-stock".
   */
  quantity?: number;
  /** @default "md" */
  size?: "sm" | "md";
  className?: string;
}

// ─── Style map ────────────────────────────────────────────────────────────────

const CONFIG: Record<
  StockStatus,
  { wrapper: string; icon: ReactNode; label: string }
> = {
  "in-stock": {
    wrapper: "bg-success-50 text-success-700 border-success-200",
    icon: <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />,
    label: "In Stock",
  },
  "low-stock": {
    wrapper: "bg-warning-50 text-warning-700 border-warning-200",
    icon: <ExclamationCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />,
    label: "Low Stock",
  },
  "out-of-stock": {
    wrapper: "bg-error-50 text-error-600 border-error-200",
    icon: <XCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />,
    label: "Out of Stock",
  },
};

const SIZE: Record<"sm" | "md", string> = {
  sm: "px-1.5 py-0.5 text-[10px] gap-1",
  md: "px-2 py-1 text-xs gap-1.5",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StockBadge — availability indicator for product cards and detail pages.
 *
 * ```tsx
 * <StockBadge status="low-stock" quantity={3} />
 * <StockBadge status="out-of-stock" size="sm" />
 * ```
 */
export function StockBadge({
  status,
  quantity,
  size = "md",
  className = "",
}: StockBadgeProps) {
  const { wrapper, icon, label } = CONFIG[status];

  const displayLabel =
    status === "low-stock" && quantity !== undefined
      ? `Only ${quantity} left`
      : label;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border font-medium",
        wrapper,
        SIZE[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {icon}
      {displayLabel}
    </span>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name       Type                                     Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * status     "in-stock"|"low-stock"|"out-of-stock"    required Availability state
 * quantity   number                                   —        Remaining quantity (low-stock)
 * size       "sm"|"md"                                "md"     Badge dimensions
 * className  string                                   ""       Extra Tailwind classes
 */
