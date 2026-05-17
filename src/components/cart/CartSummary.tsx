"use client";

import { useState, useCallback } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { TrustBadgesRow } from "@/src/components/product/atoms/TrustBadgesRow";
import { formatVND } from "@/src/lib/format";
import { useCart } from "@/src/store/cart.store";
import { useCartPriceSummary } from "@/src/hooks/useCartPriceSummary";
import type { CartItem } from "@/src/store/cart.store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartSummaryProps {
  items: CartItem[];
  /**
   * When non-empty, summary reflects only the selected items.
   * When empty, summary reflects all items.
   */
  selectedIds: Set<string>;
}

// ─── Sub-component: summary row ───────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClass = "text-secondary-900",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-secondary-500">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CartSummary — sticky price breakdown panel.
 *
 * - Reflects selected items when any are checked; otherwise reflects all items.
 * - OOS items are excluded from the price total even if selected.
 * - Checkout button shows a Tooltip when OOS items are included in the selection.
 * - Coupon input: empty → input error; invalid code → input error;
 *   valid → success toast + coupon row in breakdown; remove × clears it.
 */
export function CartSummary({ items, selectedIds }: CartSummaryProps) {
  const { state, applyCoupon, removeCoupon } = useCart();
  const appliedCoupon = state.appliedCoupon;

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  // ── Derived totals (shared hook — also used by CheckoutOrderSummary) ───────

  const {
    subtotal,
    savings,
    couponDiscount,
    total,
    billableCount,
    hasOOS: hasSelectedOOS,
  } = useCartPriceSummary(items, selectedIds, appliedCoupon, 0);

  // ── Coupon handlers ────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPromoInput(e.target.value);
      if (promoError) setPromoError("");
    },
    [promoError]
  );

  const handleApply = useCallback(() => {
    const trimmed = promoInput.trim();
    if (!trimmed) {
      setPromoError("Vui lòng nhập mã giảm giá");
      return;
    }
    const ok = applyCoupon(trimmed);
    if (ok) {
      setPromoInput("");
      setPromoError("");
    } else {
      setPromoError("Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện");
    }
  }, [promoInput, applyCoupon]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleApply();
    },
    [handleApply]
  );

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    setPromoError("");
  }, [removeCoupon]);

  // ── Checkout button ────────────────────────────────────────────────────────

  const checkoutButton = (
    <Button
      variant="danger"
      size="lg"
      fullWidth
      disabled={items.length === 0}
    >
      Tiến hành thanh toán
    </Button>
  );

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="mb-4 text-base font-semibold text-secondary-900">
        Tóm tắt đơn hàng
      </h2>

      {/* ── Price breakdown ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pb-4 border-b border-secondary-100">
        <SummaryRow
          label={`Tạm tính (${billableCount} sản phẩm)`}
          value={formatVND(subtotal)}
        />

        {savings > 0 && (
          <SummaryRow
            label="Tiết kiệm"
            value={`-${formatVND(savings)}`}
            valueClass="text-success-600"
          />
        )}

        {/* Coupon discount row — visible only when a coupon is applied */}
        {appliedCoupon && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm text-secondary-500 shrink-0">
                Mã giảm giá
              </span>
              <span className="inline-flex items-center rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold text-primary-700 uppercase tracking-wide shrink-0">
                {appliedCoupon.code}
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                aria-label="Xoá mã giảm giá"
                className="shrink-0 text-secondary-400 hover:text-error-500 transition-colors"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-sm font-medium text-success-600 shrink-0">
              -{formatVND(couponDiscount)}
            </span>
          </div>
        )}

        <SummaryRow
          label="Phí vận chuyển"
          value="Miễn phí"
          valueClass="text-success-600"
        />
      </div>

      {/* ── Total ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-4 border-b border-secondary-100">
        <span className="text-base font-semibold text-secondary-900">
          Tổng cộng
        </span>
        <span className="text-lg font-bold text-secondary-900">
          {formatVND(total)}
        </span>
      </div>

      {/* ── Promo code input — hidden once a coupon is applied ──────────── */}
      {!appliedCoupon && (
        <div className="py-4 border-b border-secondary-100">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập mã giảm giá"
              size="sm"
              fullWidth
              value={promoInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              errorMessage={promoError}
              aria-label="Mã giảm giá"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleApply}
              className="shrink-0 self-start"
            >
              Áp dụng
            </Button>
          </div>
        </div>
      )}

      {/* ── Checkout button ─────────────────────────────────────────────── */}
      <div className="pt-4">
        {hasSelectedOOS ? (
          <Tooltip
            content="Một số sản phẩm đã hết hàng"
            placement="top"
            delay={100}
          >
            {checkoutButton}
          </Tooltip>
        ) : (
          checkoutButton
        )}
      </div>

      {/* ── Trust badges ────────────────────────────────────────────────── */}
      <div className="mt-4">
        <TrustBadgesRow orientation="vertical" />
      </div>
    </div>
  );
}
