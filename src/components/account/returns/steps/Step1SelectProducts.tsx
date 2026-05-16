"use client";

import Image from "next/image";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import type {
  ReturnRequestItem,
  Step1Errors,
} from "@/src/types/account-return.types";
import type {
  OrderDetail,
  OrderDetailItem,
} from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step1Props {
  order: OrderDetail;
  /** Pre-filtered: only the items the user is still eligible to return */
  eligibleItems: OrderDetailItem[];
  selectedItems: ReturnRequestItem[];
  onChange: (selectedItems: ReturnRequestItem[]) => void;
  onNext: () => void;
  errors: Step1Errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step1SelectProducts({
  order,
  eligibleItems,
  selectedItems,
  onChange,
  onNext,
  errors,
}: Step1Props) {
  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleItemToggle(itemId: string, checked: boolean) {
    if (checked) {
      onChange([...selectedItems, { itemId, returnQuantity: 1 }]);
    } else {
      onChange(selectedItems.filter((si) => si.itemId !== itemId));
    }
  }

  function handleQtyChange(itemId: string, rawValue: number) {
    const item = eligibleItems.find((i) => i.id === itemId);
    if (!item) return;
    const qty = Math.max(1, Math.min(Math.floor(rawValue || 1), item.quantity));
    onChange(
      selectedItems.map((si) =>
        si.itemId === itemId ? { ...si, returnQuantity: qty } : si
      )
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* ── Order summary header ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3">
        <p className="text-sm text-secondary-600">
          Đơn hàng:{" "}
          <span className="font-semibold text-secondary-900">{order.id}</span>
        </p>
        <p className="mt-0.5 text-sm text-secondary-600">
          Ngày đặt:{" "}
          <span className="font-medium text-secondary-900">
            {formatDate(order.placedAt)}
          </span>
        </p>
      </div>

      {/* ── Product list (eligible items only) ──────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-semibold text-secondary-700">
          Sản phẩm trong đơn hàng
        </p>

        <div className="flex flex-col gap-2">
          {eligibleItems.map((item) => {
            const isChecked = selectedItems.some((si) => si.itemId === item.id);
            const currentSelected = selectedItems.find(
              (si) => si.itemId === item.id
            );
            const rowId = `return-item-${item.id}`;

            return (
              <label
                key={item.id}
                htmlFor={rowId}
                className={[
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors duration-150",
                  isChecked
                    ? "border-primary-300 bg-primary-50"
                    : "border-secondary-200 hover:bg-secondary-50",
                ].join(" ")}
              >
                {/* Checkbox */}
                <Checkbox
                  id={rowId}
                  size="md"
                  checked={isChecked}
                  onChange={(e) => handleItemToggle(item.id, e.target.checked)}
                />

                {/* Thumbnail */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-secondary-50">
                  <Image
                    src={item.thumbnailSrc}
                    alt={item.name}
                    fill
                    sizes="48px"
                    className="object-contain p-0.5"
                  />
                </div>

                {/* Name + variant */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-secondary-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {item.variantLabel}
                  </p>
                </div>

                {/* Quantity input — only when checked; stops row click propagation */}
                {isChecked && (
                  <div
                    className="flex shrink-0 items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-xs text-secondary-500">SL trả:</span>
                    <div className="w-16">
                      <Input
                        type="number"
                        size="sm"
                        min={1}
                        max={item.quantity}
                        value={String(currentSelected?.returnQuantity ?? 1)}
                        onChange={(e) =>
                          handleQtyChange(item.id, Number(e.target.value))
                        }
                      />
                    </div>
                    <span className="text-xs text-secondary-400">
                      / {item.quantity}
                    </span>
                  </div>
                )}
              </label>
            );
          })}
        </div>

        {/* Items error */}
        {errors.items && (
          <p className="mt-2 text-xs text-error-600">{errors.items}</p>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div className="flex justify-end border-t border-secondary-100 pt-4">
        <Button variant="primary" size="md" onClick={onNext}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
