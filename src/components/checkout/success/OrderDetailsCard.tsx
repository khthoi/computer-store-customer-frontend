import Image from "next/image";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  TruckIcon,
  CalendarDaysIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { BoltIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import type { SuccessOrder } from "@/src/types/checkout-success.types";

// ─── Payment icon map ─────────────────────────────────────────────────────────
//
// Mirrors the ICON map in PaymentMethodSelector — same SVG file paths.
// Defined here (not imported) because PaymentMethodSelector does not export
// its icon map; duplicating 4 image references is the correct trade-off.

const PAYMENT_ICON: Record<string, string> = {
  cod: "/svg/payment-method-cash-on-delivery.svg",
  "bank-transfer": "/svg/payment-method-creditcard.svg",
  momo: "/svg/payment-method-MOMO.svg",
  zalopay: "/svg/payment-method-ZaloPay.svg",
};

const ICON_PAYMENT_METHOD_WIDTH = 36;
const ICON_PAYMENT_METHOD_HEIGHT = 36;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Reusable label + value row — same visual language as CheckoutOrderSummary. */
function SummaryRow({
  label,
  value,
  valueClass = "text-secondary-900",
}: {
  label: React.ReactNode;
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

/** Small info row with a HeroIcon prefix. */
function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-secondary-700">
      <span className="mt-0.5 shrink-0 text-secondary-400">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderDetailsCardProps {
  order: SuccessOrder;
}

const PROMOTION_TYPE_LABEL: Record<string, string> = {
  flashsale: "Flash Sale",
  auto: "Khuyến mãi",
  coupon: "Voucher",
};

/**
 * OrderDetailsCard — complete order summary card.
 *
 * Section A: Recipient info (left) + Shipping/payment (right)
 * Section B: Ordered items list (scrollable beyond 4 items)
 * Section C: Cost breakdown (mirrors CheckoutOrderSummary visual language)
 *
 * Pure render — no hooks, no store access.
 */
export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const { recipient, shippingMethod, paymentMethod, items, pricing } = order;

  const paymentIconSrc = PAYMENT_ICON[paymentMethod.id];

  // Format placed-at date in Vietnamese locale.
  const placedAtFormatted = new Date(order.placedAt).toLocaleDateString(
    "vi-VN",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">

      {/* ── Section A: Recipient + Shipping/Payment ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        {/* Left: Recipient */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Địa chỉ giao hàng
          </p>
          <p className="font-semibold text-secondary-900">{recipient.fullName}</p>
          <div className="space-y-1.5">
            <InfoRow icon={<PhoneIcon className="h-4 w-4" />}>
              {recipient.phone}
            </InfoRow>
            <InfoRow icon={<EnvelopeIcon className="h-4 w-4" />}>
              {recipient.email}
            </InfoRow>
            <InfoRow icon={<MapPinIcon className="h-4 w-4" />}>
              {recipient.addressDetail},{" "}
              {recipient.ward}, {recipient.district},{" "}
              {recipient.province}
            </InfoRow>
          </div>
        </div>

        {/* Right: Payment + Shipping */}
        <div className="space-y-4">
          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
              Phương thức thanh toán
            </p>
            <div className="flex items-center gap-2.5">
              {paymentIconSrc ? (
                <Image
                  src={paymentIconSrc}
                  alt={paymentMethod.name}
                  width={ICON_PAYMENT_METHOD_WIDTH}
                  height={ICON_PAYMENT_METHOD_HEIGHT}
                  className="object-contain"
                />
              ) : (
                <CreditCardIcon className="h-6 w-6 text-secondary-400" />
              )}
              <span className="text-sm font-medium text-secondary-800">
                {paymentMethod.name}
              </span>
            </div>
          </div>

          {/* Shipping method + estimated delivery */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
              Vận chuyển
            </p>
            <InfoRow icon={<TruckIcon className="h-4 w-4" />}>
              {shippingMethod.name}
              {shippingMethod.price > 0 && (
                <span className="ml-1 text-secondary-500">
                  ({formatVND(shippingMethod.price)})
                </span>
              )}
            </InfoRow>
            <InfoRow icon={<CalendarDaysIcon className="h-4 w-4" />}>
              Dự kiến:&nbsp;
              <time dateTime={order.estimatedDeliveryIso}>
                {order.estimatedDelivery}
              </time>
            </InfoRow>
          </div>

          {/* Order date */}
          <p className="text-xs text-secondary-400">
            Đặt lúc{" "}
            <time dateTime={order.placedAt}>{placedAtFormatted}</time>
          </p>
        </div>
      </div>

      <hr className="my-6 border-secondary-100" />

      {/* ── Section B: Items list ───────────────────────────────────────── */}
      <div
        role="region"
        aria-label="Danh sách sản phẩm trong đơn hàng"
        tabIndex={0}
        className={[
          "space-y-4 outline-none",
          items.length > 4 ? "max-h-72 overflow-y-auto pr-2 pt-5" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {items.map((item) => {
          const linePrice = item.currentPrice * item.quantity;
          const originalLinePrice = item.originalPrice * item.quantity;
          const hasDiscount = item.originalPrice > item.currentPrice;

          return (
            <div key={item.id} className="flex items-start gap-3">
              {/* Thumbnail with quantity badge */}
              <div className="relative shrink-0">
                <Image
                  src={item.thumbnailSrc}
                  alt={item.name}
                  width={64}
                  height={64}
                  sizes="64px"
                  quality={75}
                  style={{ objectFit: "cover" }}
                  className="h-16 w-16 rounded-lg border border-secondary-100"
                />
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 min-w-[1.125rem] items-center justify-center rounded-full bg-secondary-600 px-1 text-[10px] font-bold text-white leading-none">
                  {item.quantity}
                </span>
              </div>

              {/* Info block */}
              <div className="flex-1 min-w-0">
                {/* Brand pill + flash-sale badge */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-500">
                    {item.brand}
                  </span>
                  {item.flashSale && (
                    <Tooltip content={item.flashSale.name} placement="top" delay={300}>
                      <span className="inline-flex items-center gap-0.5 rounded bg-error-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error-700">
                        <BoltIcon className="h-3 w-3" aria-hidden="true" />
                        Flash Sale
                      </span>
                    </Tooltip>
                  )}
                </div>

                {/* Product name — 2-line clamp + tooltip + new tab.
                    line-clamp-2 lives on the div (block context for clamping).
                    Tooltip wraps the inline <a> so it anchors to the text width,
                    not to the full-width container — consistent with CartItem. */}
                <div className="mt-0.5 line-clamp-2">
                  <Tooltip content={item.name} placement="top" delay={400}>
                    <a
                      href={`/products/${item.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors"
                    >
                      {item.name}
                    </a>
                  </Tooltip>
                </div>

                {item.variantLabel && (
                  <p className="mt-0.5 text-xs text-secondary-500">
                    {item.variantLabel}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-secondary-900">
                  {formatVND(linePrice)}
                </p>
                {hasDiscount && (
                  <p className="text-xs text-secondary-400 line-through">
                    {formatVND(originalLinePrice)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <hr className="my-6 border-secondary-100" />

      {/* ── Section C: Cost breakdown ───────────────────────────────────── */}
      {/* Visual language mirrors CheckoutOrderSummary exactly. */}
      <div className="flex flex-col gap-2.5">
        <SummaryRow
          label={`Tạm tính (${items.length} sản phẩm)`}
          value={formatVND(pricing.subtotal)}
        />

        {pricing.savings > 0 && (
          <SummaryRow
            label="Tiết kiệm"
            value={`-${formatVND(pricing.savings)}`}
            valueClass="text-success-600"
          />
        )}

        {pricing.appliedPromotions
          .filter((p) => p.type !== "flashsale")
          .map((promo, idx) => (
            <div key={`${promo.type}-${promo.id ?? idx}`} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex shrink-0 items-center rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                  {PROMOTION_TYPE_LABEL[promo.type] ?? "Khuyến mãi"}
                </span>
                <span className="truncate text-sm text-secondary-700">
                  {promo.maCoupon ?? promo.name}
                </span>
              </div>
              <span className="ml-2 text-sm font-medium text-success-600 shrink-0">
                -{formatVND(promo.amount)}
              </span>
            </div>
          ))}

        <SummaryRow
          label="Phí vận chuyển"
          value={
            pricing.shippingFee === 0
              ? "Miễn phí"
              : formatVND(pricing.shippingFee)
          }
          valueClass={
            pricing.shippingFee === 0 ? "text-success-600" : "text-secondary-900"
          }
        />
      </div>

      {/* Total */}
      <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-4">
        <span className="text-base font-semibold text-secondary-900">
          Tổng cộng
        </span>
        <span className="text-lg font-bold text-primary-600">
          {formatVND(pricing.total)}
        </span>
      </div>
    </div>
  );
}
