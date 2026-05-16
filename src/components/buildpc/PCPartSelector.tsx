"use client";

import { useCallback, type ReactNode } from "react";
import Image from "next/image";
import {
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid";
import {
  PlusCircleIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  CpuChipIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/src/components/ui/Badge";
import { PriceTag } from "@/src/components/product/PriceTag";
import { Tooltip } from "@/src/components/ui/Tooltip";
import type { CompatibilityStatus } from "./PCPartCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedPartInfo {
  id: string;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;
  /** Original (pre-sale) price for the PriceTag discount display */
  originalPrice?: number;
  /** Warranty duration (e.g. "36 tháng") */
  warranty?: string;
  /** Remaining units shown as "Còn N sản phẩm" */
  stockQuantity?: number;
  /** Human-readable label of the chosen variant (e.g. "Hộp (Box)") */
  selectedVariant?: string;
  /** Opens product detail in a new tab when the name is clicked */
  href?: string;
  compatibilityStatus?: CompatibilityStatus;
  compatibilityNote?: string;
}

export interface PCPartSelectorProps {
  /** Machine-readable category key (e.g. "cpu", "motherboard") */
  category: string;
  /** Human-readable label shown as heading (e.g. "CPU", "Motherboard") */
  categoryLabel: string;
  /** Icon rendered next to the category label. Pass a ReactNode or a string path to an SVG in /public. */
  icon?: ReactNode | string;
  /** Currently selected part. Null/undefined renders the placeholder. */
  selectedPart?: SelectedPartInfo | null;
  /** Called when the user clicks "Select [category]" or "Change" */
  onSelect?: (category: string) => void;
  /** Called when the user clicks the remove (×) button */
  onRemove?: (category: string) => void;
  /** Marks the slot as required — shows a red asterisk in the label */
  required?: boolean;
  isLoading?: boolean;
  /** Current quantity of this part in the slot (>=1). Stepper is hidden when maxQuantity <= 1. */
  quantity?: number;
  /** Upper bound for the quantity stepper (from slot.soLuong). */
  maxQuantity?: number;
  /** Called when the user changes the quantity via the stepper. */
  onQuantityChange?: (category: string, nextQuantity: number) => void;
  className?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function CompatibilityChip({
  status,
  note,
}: {
  status: CompatibilityStatus;
  note?: string;
}) {
  const config: Record<CompatibilityStatus, { icon: ReactNode; label: string; cls: string }> = {
    compatible: { icon: <CheckCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />, label: "Compatible", cls: "bg-success-50 text-success-700 border-success-200" },
    incompatible: { icon: <XCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />, label: "Incompatible", cls: "bg-error-50 text-error-700 border-error-200" },
    warning: { icon: <ExclamationCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />, label: "Check compatibility", cls: "bg-warning-50 text-warning-700 border-warning-200" },
    unchecked: { icon: <QuestionMarkCircleIcon className="w-3.5 h-3.5" aria-hidden="true" />, label: "Unchecked", cls: "bg-secondary-50 text-secondary-500 border-secondary-200" },
  };
  const { icon, label, cls } = config[status];

  return (
    <span
      title={note ?? label}
      aria-label={note ?? label}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        cls,
      ].join(" ")}
    >
      {icon}
      {note ?? label}
    </span>
  );
}

// ─── Quantity stepper ─────────────────────────────────────────────────────────

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (next: number) => void;
}

function QuantityStepper({ value, min, max, label, onChange }: QuantityStepperProps) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-lg border border-secondary-200 bg-white"
      role="group"
      aria-label={`Số lượng ${label}`}
    >
      <button
        type="button"
        onClick={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        aria-label={`Giảm số lượng ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-l-lg text-secondary-500 transition-colors enabled:hover:bg-secondary-100 enabled:hover:text-secondary-900 disabled:cursor-not-allowed disabled:text-secondary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <MinusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        className="min-w-[1.5rem] px-1 text-center text-xs font-semibold tabular-nums text-secondary-800"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        aria-label={`Tăng số lượng ${label}`}
        title={!canInc ? `Tối đa ${max} cho slot này` : undefined}
        className="flex h-7 w-7 items-center justify-center rounded-r-lg text-secondary-500 transition-colors enabled:hover:bg-secondary-100 enabled:hover:text-secondary-900 disabled:cursor-not-allowed disabled:text-secondary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={`Loading ${label}`}
      className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-white px-4 py-3"
    >
      <div className="h-14 w-14 shrink-0 rounded-lg animate-pulse bg-secondary-200" aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-16 rounded animate-pulse bg-secondary-200" aria-hidden="true" />
        <div className="h-4 w-48 rounded animate-pulse bg-secondary-200" aria-hidden="true" />
        <div className="h-4 w-24 rounded animate-pulse bg-secondary-200" aria-hidden="true" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PCPartSelector — single-slot row in the Build PC configurator.
 * Shows a placeholder when nothing is selected; shows the selected
 * part's thumbnail, name, price (with discount), warranty, stock, compatibility,
 * and Change/Remove actions.
 *
 * ```tsx
 * <PCPartSelector
 *   category="cpu"
 *   categoryLabel="CPU"
 *   icon={<CpuChipIcon className="w-5 h-5" />}
 *   required
 *   selectedPart={build.cpu}
 *   onSelect={(cat) => openPartPicker(cat)}
 *   onRemove={(cat) => removePart(cat)}
 * />
 * ```
 */
export function PCPartSelector({
  category,
  categoryLabel,
  icon,
  selectedPart,
  onSelect,
  onRemove,
  required = false,
  isLoading = false,
  quantity = 1,
  maxQuantity = 1,
  onQuantityChange,
  className = "",
}: PCPartSelectorProps) {
  const handleSelect = useCallback(() => onSelect?.(category), [category, onSelect]);
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemove?.(category);
    },
    [category, onRemove]
  );
  const handleQty = useCallback(
    (next: number) => onQuantityChange?.(category, next),
    [category, onQuantityChange]
  );
  // Bound the upper quantity by stock when known
  const effectiveMaxQty = selectedPart?.stockQuantity != null
    ? Math.max(1, Math.min(maxQuantity, selectedPart.stockQuantity))
    : Math.max(1, maxQuantity);
  const showStepper = maxQuantity > 1 && Boolean(selectedPart) && Boolean(onQuantityChange);

  if (isLoading) return <SkeletonRow label={categoryLabel} />;

  return (
    <div
      className={[
        "flex items-center gap-4 rounded-xl border-2 transition-all duration-150",
        selectedPart
          ? "border-secondary-200 bg-white px-4 py-3 hover:border-secondary-300 hover:shadow-sm"
          : "border-dashed border-secondary-300 bg-secondary-50/50 px-4 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Category label column */}
      <div className="flex w-36 shrink-0 items-center gap-2">
        <span className="text-secondary-400" aria-hidden="true">
          {typeof icon === "string" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" width={30} height={30} className="shrink-0 opacity-60" aria-hidden="true" />
          ) : (
            icon ?? <CpuChipIcon className="w-5 h-5" />
          )}
        </span>
        <span className="text-sm font-semibold text-secondary-700">
          {categoryLabel}
          {required && (
            <span className="ml-0.5 text-error-500" aria-hidden="true">*</span>
          )}
        </span>
      </div>

      {selectedPart ? (
        // ── Selected state ──────────────────────────────────────────────────
        <>
          {/* Thumbnail — clickable when href is available */}
          {selectedPart.href ? (
            <a
              href={selectedPart.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden="true"
              className="shrink-0"
            >
              <Image
                src={selectedPart.thumbnail}
                alt={selectedPart.name}
                width={108}
                height={108}
                className="h-27 w-27 rounded-lg object-contain transition-opacity hover:opacity-80"
              />
            </a>
          ) : (
            <Image
              src={selectedPart.thumbnail}
              alt={selectedPart.name}
              width={108}
              height={108}
              className="h-27 w-27 shrink-0 rounded-lg object-contain"
            />
          )}

          {/* Part info */}
          <div className="flex flex-1 min-w-0 flex-col gap-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-400">
              {selectedPart.brand}
            </p>
            <Tooltip content={selectedPart.name} placement="top-start">
              {selectedPart.href ? (
                <a
                  href={selectedPart.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="line-clamp-3 w-max max-w-full text-sm font-medium text-secondary-900 transition-colors hover:text-primary-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  {selectedPart.name}
                </a>
              ) : (
                <p className="line-clamp-3 w-max max-w-full text-sm font-medium text-secondary-900">
                  {selectedPart.name}
                </p>
              )}
            </Tooltip>

            {/* Selected variant */}
            {selectedPart.selectedVariant && (
              <span className="inline-flex w-fit items-center rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 border border-primary-200">
                {selectedPart.selectedVariant}
              </span>
            )}

            {/* Price — uses PriceTag for discount display */}
            <PriceTag
              currentPrice={selectedPart.price}
              originalPrice={selectedPart.originalPrice}
              size="sm"
            />

            {/* Warranty + stock */}
            {(selectedPart.warranty || (selectedPart.stockQuantity !== undefined && selectedPart.stockQuantity > 0)) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {selectedPart.warranty && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-secondary-400">Bảo hành:</span>
                    <Badge variant="default" size="sm">{selectedPart.warranty}</Badge>
                  </div>
                )}
                {selectedPart.stockQuantity !== undefined && selectedPart.stockQuantity > 0 && (
                  <span className="text-[11px] text-secondary-400">
                    Còn {selectedPart.stockQuantity} sản phẩm
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Compatibility chip */}
          {selectedPart.compatibilityStatus && (
            <div className="hidden sm:block">
              <CompatibilityChip
                status={selectedPart.compatibilityStatus}
                note={selectedPart.compatibilityNote}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {showStepper && (
              <QuantityStepper
                value={Math.min(Math.max(1, quantity), effectiveMaxQty)}
                min={1}
                max={effectiveMaxQty}
                label={categoryLabel}
                onChange={handleQty}
              />
            )}
            <button
              type="button"
              onClick={handleSelect}
              aria-label={`Change ${categoryLabel}`}
              className="flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-600 transition-colors hover:bg-secondary-100 hover:text-secondary-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ArrowsRightLeftIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Change</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label={`Remove ${categoryLabel}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary-400 transition-colors hover:bg-error-50 hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-400"
            >
              <XMarkIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </>
      ) : (
        // ── Placeholder / unselected state ──────────────────────────────────
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-secondary-400">
              No {categoryLabel.toLowerCase()} selected
            </p>
          </div>
          <button
            type="button"
            onClick={handleSelect}
            aria-label={`Select ${categoryLabel}`}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 active:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <PlusCircleIcon className="w-4 h-4" aria-hidden="true" />
            Select {categoryLabel}
          </button>
        </>
      )}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name          Type                          Default      Description
 * ──────────────────────────────────────────────────────────────────────────────
 * category      string                        required     Machine-readable category key
 * categoryLabel string                        required     Human-readable label
 * icon          ReactNode                     CpuChipIcon  Icon next to category label
 * selectedPart  SelectedPartInfo | null       —            Currently selected part data
 * onSelect      (category: string) => void    —            Opens the part picker
 * onRemove      (category: string) => void    —            Removes the selected part
 * required      boolean                       false        Show asterisk on label
 * isLoading     boolean                       false        Show skeleton state
 * className     string                        ""           Extra classes on root div
 *
 * ─── SelectedPartInfo ─────────────────────────────────────────────────────────
 *
 * Name                 Type                Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * id                   string              yes       Part identifier
 * name                 string              yes       Display name
 * brand                string              yes       Brand
 * thumbnail            string              yes       Image URL
 * price                number              yes       Sale price (VND)
 * originalPrice        number              no        Pre-sale price for discount badge
 * warranty             string              no        Warranty duration (e.g. "36 tháng")
 * stockQuantity        number              no        Remaining units
 * compatibilityStatus  CompatibilityStatus no        Relative to current build
 * compatibilityNote    string              no        Chip label override
 */
