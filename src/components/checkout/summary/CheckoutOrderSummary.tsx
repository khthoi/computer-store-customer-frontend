"use client";

import Image from "next/image";
import { useCart } from "@/src/store/cart.store";
import { useCheckout } from "@/src/store/checkout.store";
import { useCartPriceSummary } from "@/src/hooks/useCartPriceSummary";
import { formatVND } from "@/src/lib/format";
import { Tooltip } from "@/src/components/ui/Tooltip";

// ─── Constants ────────────────────────────────────────────────────────────────

// Stable empty Set — passing this to useCartPriceSummary means "include all items"
// (the hook treats empty selectedIds as "no filter applied").
const ALL_ITEMS = new Set<string>();

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
 * CheckoutOrderSummary — compact read-only order panel for the /checkout page.
 *
 * Reuses `useCartPriceSummary` (same hook as CartSummary on /cart) so price
 * logic is never duplicated. Shipping fee is derived from the selected method
 * in checkout store and added to the total automatically.
 */
export function CheckoutOrderSummary() {
  const { state: cartState } = useCart();
  const { state: checkoutState, shippingMethods } = useCheckout();

  const { items, appliedCoupon } = cartState;
  const { shippingMethodId } = checkoutState;

  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId);
  const shippingFee = selectedShipping?.price ?? 0;

  const { subtotal, savings, couponDiscount, total, billableCount } =
    useCartPriceSummary(items, ALL_ITEMS, appliedCoupon, shippingFee);

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="mb-4 text-base font-semibold text-secondary-900">
        Đơn hàng ({billableCount} sản phẩm)
      </h2>

      {/* ── Compact item list ──────────────────────────────────────────── */}
      <ul
        className="mb-4 max-h-70 space-y-3 overflow-y-auto pr-1"
        aria-label="Danh sách sản phẩm"
      >
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            {/* Thumbnail with quantity badge */}
            <div className="relative shrink-0">
              <Image
                src={item.thumbnailSrc}
                alt={item.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-cover border border-secondary-100"
              />
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-secondary-600 px-1 text-[10px] font-bold text-white leading-none">
                {item.quantity}
              </span>
            </div>

            {/* Name + variant */}
            <div className="flex-1 min-w-0">
              <Tooltip content={item.name} placement="top" delay={400}>
                <a
                  href={`/products/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-secondary-900 line-clamp-3 hover:text-primary-600 transition-colors"
                >
                  {item.name}
                </a>
              </Tooltip>
              {item.variantLabel && (
                <p className="text-[10px] text-secondary-500 mt-0.5">
                  {item.variantLabel}
                </p>
              )}
            </div>

            {/* Line price */}
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-secondary-900">
                {formatVND(item.currentPrice * item.quantity)}
              </p>
              {item.originalPrice > item.currentPrice && (
                <p className="text-[10px] text-secondary-400 line-through">
                  {formatVND(item.originalPrice * item.quantity)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* ── Price breakdown ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-2.5 border-t border-secondary-100 pt-4">
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

        {appliedCoupon && couponDiscount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-secondary-500">Mã giảm giá</span>
              <span className="inline-flex items-center rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold text-primary-700 uppercase tracking-wide">
                {appliedCoupon.code}
              </span>
            </div>
            <span className="text-sm font-medium text-success-600">
              -{formatVND(couponDiscount)}
            </span>
          </div>
        )}

        <SummaryRow
          label="Phí vận chuyển"
          value={shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}
          valueClass={shippingFee === 0 ? "text-success-600" : "text-secondary-900"}
        />
      </div>

      {/* ── Total ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-secondary-100 pt-4 mt-2">
        <span className="text-base font-semibold text-secondary-900">
          Tổng cộng
        </span>
        <span className="text-lg font-bold text-primary-600">
          {formatVND(total)}
        </span>
      </div>
    </div>
  );
}
