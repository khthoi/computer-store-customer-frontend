"use client";

import {
  ShoppingCartIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon as OutlineWarningIcon,
  PhotoIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import { formatVND } from "@/src/lib/format";
import type { CompatibilityStatus } from "./PCPartCard";
import type { CompatibilityIssue } from "./CompatibilityAlert";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildSlot {
  /** Machine-readable category (e.g. "cpu") */
  category: string;
  /** Human-readable label (e.g. "CPU") */
  categoryLabel: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Selected part — null/undefined means empty slot */
  part?: {
    id: string;
    name: string;
    brand: string;
    thumbnail: string;
    price: number;
    compatibilityStatus?: CompatibilityStatus;
  } | null;
  /** Quantity of `part` in this slot (defaults to 1). */
  quantity?: number;
}

export interface PCBuildSummaryProps {
  /** All component slots in the build */
  slots: BuildSlot[];
  /**
   * List of detected compatibility issues.
   * Pass an empty array (default) for a clean build.
   */
  compatibilityIssues?: CompatibilityIssue[];
  /** Called when the user clicks "Thêm vào giỏ hàng" */
  onAddAllToCart?: () => void;
  /** Shows loading spinner on the Add to Cart button */
  isAddingToCart?: boolean;
  /** Called when the user clicks "Xuất cấu hình" */
  onExportBuild?: () => void;
  /**
   * When true the Export button shows a "Đã lưu!" confirmation state.
   * Reset to false externally after ~2 seconds.
   */
  isBuildSaved?: boolean;
  /** Export as PNG image */
  onExportPNG?: () => void;
  /** Export as PDF document */
  onExportPDF?: () => void;
  /** Export as Excel spreadsheet */
  onExportExcel?: () => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PCBuildSummary — compact horizontal bar summarising the current PC build.
 *
 * Shows: component count + compatibility badge (left) · total price (center) ·
 * "Xuất cấu hình" + "Thêm vào giỏ hàng" CTA buttons (right).
 *
 * **Add-to-Cart is never blocked by compatibility issues.**
 * A non-blocking warning is displayed when errors exist so the user can
 * decide whether to proceed.
 *
 * ```tsx
 * <PCBuildSummary
 *   slots={buildSlots}
 *   compatibilityIssues={issues}
 *   onAddAllToCart={handleAddAllToCart}
 *   isAddingToCart={isLoading}
 *   onExportBuild={handleExport}
 *   isBuildSaved={buildSaved}
 * />
 * ```
 */
export function PCBuildSummary({
  slots,
  compatibilityIssues = [],
  onAddAllToCart,
  isAddingToCart = false,
  onExportBuild,
  isBuildSaved = false,
  onExportPNG,
  onExportPDF,
  onExportExcel,
  className = "",
}: PCBuildSummaryProps) {
  const selectedSlots = slots.filter((s) => s.part != null);
  const totalCost     = selectedSlots.reduce((sum, s) => sum + (s.part?.price ?? 0) * (s.quantity ?? 1), 0);
  const selectedCount = selectedSlots.length;
  const totalSlots    = slots.length;
  const errorCount    = compatibilityIssues.filter((i) => i.severity === "error").length;
  const warningCount  = compatibilityIssues.filter((i) => i.severity === "warning").length;
  const isClean       = compatibilityIssues.length === 0;

  // Add to cart is allowed even with compatibility errors — user sees a warning.
  const canAddToCart  = selectedCount > 0 && !isAddingToCart;

  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-4 rounded-xl border border-secondary-200 bg-white px-5 py-4 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Left: component count + compatibility badge */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-secondary-600 flex my-auto gap-1">
          Linh kiện đã chọn:{" "}
          <span className="font-bold text-secondary-900">
            {selectedCount}/{totalSlots}
          </span>
        </p>

        {selectedCount > 0 && (
          isClean ? (
            <span className="flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
              <CheckBadgeIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Tương thích
            </span>
          ) : errorCount > 0 ? (
            <span className="flex items-center gap-1.5 rounded-full bg-error-50 px-2.5 py-1 text-xs font-semibold text-error-700">
              <XCircleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {errorCount} lỗi
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {warningCount} cảnh báo
            </span>
          )
        )}
      </div>

      {/* Center: total price */}
      <p className="text-sm font-medium text-secondary-600 my-auto flex gap-1">
        Tổng tiền:{" "}
        <span className="font-bold text-primary-700">
          {selectedCount > 0 ? formatVND(totalCost) : "—"}
        </span>
      </p>

      {/* Right: non-blocking warning + action buttons */}
      <div className="flex flex-col items-end gap-2">
        {/* Non-blocking compatibility warning */}
        {errorCount > 0 && (
          <p className="flex items-center gap-1 text-xs text-warning-600">
            <OutlineWarningIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Có {errorCount} lỗi tương thích cấu hình.
          </p>
        )}

        <div className="flex items-center gap-2">
          {/* Compact export group: PNG / PDF / Excel */}
          {(onExportPNG || onExportPDF || onExportExcel) && (
            <div className="flex items-center gap-1">
              {onExportPNG && (
                <button
                  type="button"
                  onClick={onExportPNG}
                  className="flex items-center gap-1 border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <PhotoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  PNG
                </button>
              )}
              {onExportPDF && (
                <button
                  type="button"
                  onClick={onExportPDF}
                  className="flex items-center gap-1 border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <DocumentTextIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  PDF
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex items-center gap-1 border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 rounded-xl px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <TableCellsIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Excel
                </button>
              )}
            </div>
          )}

          {/* Export / Save build */}
          {onExportBuild && (
            <button
              type="button"
              onClick={onExportBuild}
              className={[
                "flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
                isBuildSaved
                  ? "border-success-200 bg-success-50 text-success-700"
                  : "border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900",
              ].join(" ")}
            >
              {isBuildSaved ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-success-500" aria-hidden="true" />
                  Đã lưu!
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                  Xuất cấu hình
                </>
              )}
            </button>
          )}

          {/* Add all to cart */}
          <button
            type="button"
            disabled={!canAddToCart}
            onClick={onAddAllToCart}
            className={[
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150",
              canAddToCart
                ? errorCount > 0
                  ? "bg-warning-500 text-white shadow-sm hover:bg-warning-600 active:bg-warning-700"
                  : "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800"
                : "cursor-not-allowed bg-secondary-100 text-secondary-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
            ].join(" ")}
          >
            {isAddingToCart ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Đang thêm…
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4" aria-hidden="true" />
                Thêm vào giỏ hàng
                {selectedCount > 0 && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                    {selectedCount}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name                  Type                     Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * slots                 BuildSlot[]              required All build component slots
 * compatibilityIssues   CompatibilityIssue[]     []       Detected issues
 * onAddAllToCart        () => void               —        "Thêm vào giỏ" callback
 * isAddingToCart        boolean                  false    Spinner on Add to Cart button
 * onExportBuild         () => void               —        "Xuất cấu hình" callback
 * isBuildSaved          boolean                  false    Shows "Đã lưu!" confirmation
 * className             string                   ""       Extra classes on root div
 */
