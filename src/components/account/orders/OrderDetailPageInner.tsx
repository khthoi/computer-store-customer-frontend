"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ArchiveBoxXMarkIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import { OrderStatusBadge } from "@/src/components/account/orders/OrderStatusBadge";
import { OrderTimeline } from "@/src/components/account/orders/OrderTimeline";
import { OrderShippingCard } from "@/src/components/account/orders/OrderShippingCard";
import { OrderCancelModal } from "@/src/components/account/orders/OrderCancelModal";
import { OrderReviewModal } from "@/src/components/account/orders/OrderReviewModal";
import { ToastMessage } from "@/src/components/ui/Toast";
import { cancelOrder } from "@/src/services/account-order.service";
import type {
  OrderDetail,
  OrderDetailItem,
  OrderStatus,
  TimelineEvent,
} from "@/src/types/account-order.types";

// ─── Sub-component: single item row ───────────────────────────────────────────

const MAX_VISIBLE_BRANDS = 3;

function BrandsRow({ brands }: { brands: string[] }) {
  if (!brands.length) return null;
  const visible = brands.slice(0, MAX_VISIBLE_BRANDS);
  const hidden = brands.slice(MAX_VISIBLE_BRANDS);
  const hasOverflow = hidden.length > 0;
  return (
    <Tooltip content={brands.join(" • ")} placement="top" delay={300}>
      <div className="flex items-center gap-1 overflow-hidden">
        {visible.map((b) => (
          <span
            key={b}
            className="shrink-0 inline-flex max-w-[120px] items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-500 truncate"
          >
            {b}
          </span>
        ))}
        {hasOverflow && (
          <span
            aria-label={`Còn ${hidden.length} thương hiệu khác`}
            className="shrink-0 inline-flex items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold text-secondary-500"
          >
            …
          </span>
        )}
      </div>
    </Tooltip>
  );
}

function CategoryRow({ name }: { name: string }) {
  if (!name) return null;
  return (
    <div className="flex max-w-full overflow-hidden">
      <Tooltip content={name} placement="top" delay={300}>
        <span className="inline-block max-w-full truncate rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
          {name}
        </span>
      </Tooltip>
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderDetailItem }) {
  const hasDiscount =
    item.originalUnitPrice !== undefined &&
    item.originalUnitPrice > item.unitPrice;

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
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
        {/* Brands row — separate pills, single line, "…" + tooltip on overflow */}
        <BrandsRow brands={item.brands} />

        {/* Category row — single pill, truncate + tooltip on overflow */}
        {item.categoryName && (
          <div className="mt-0.5">
            <CategoryRow name={item.categoryName} />
          </div>
        )}

        {/* 2-line clamped product name with tooltip */}
        <div className="mt-0.5 line-clamp-2">
          <Tooltip content={item.name} placement="top" delay={400}>
            <Link
              href={`/products/${item.slug}`}
              className="text-sm font-medium text-secondary-900 hover:text-primary-600 transition-colors"
            >
              {item.name}
            </Link>
          </Tooltip>
        </div>

        {item.variantLabel && (
          <p className="mt-0.5 mb-0 text-xs text-secondary-500">{item.variantLabel}</p>
        )}
        {item.sku && (
          <p className="mt-0.5 text-[11px] font-mono text-secondary-400">
            SKU: {item.sku}
          </p>
        )}
      </div>

      {/* Price block */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-secondary-900">
          {formatVND(item.subtotal)}
        </p>
        {hasDiscount && item.originalUnitPrice && (
          <p className="text-xs text-secondary-400 line-through">
            {formatVND(item.originalUnitPrice * item.quantity)}
          </p>
        )}
        {item.quantity > 1 && (
          <p className="text-xs text-secondary-400">
            {formatVND(item.unitPrice)} / cái
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-component: payment summary card ──────────────────────────────────────

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

function PaymentSummaryCard({
  payment,
  itemCount,
}: {
  payment: OrderDetail["payment"];
  itemCount: number;
}) {
  return (
    <div className="h-full rounded-2xl border border-secondary-200 bg-white p-5 flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
        Tóm tắt thanh toán
      </p>

      <div className="space-y-2.5">
        <SummaryRow
          label={`Tạm tính (${itemCount} sản phẩm)`}
          value={formatVND(payment.subtotal)}
        />

        {payment.discount > 0 && (
          <SummaryRow
            label="Tiết kiệm"
            value={`-${formatVND(payment.discount)}`}
            valueClass="text-success-600"
          />
        )}

        {payment.couponCode && payment.couponDiscount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-secondary-500">Mã giảm giá</span>
              <span className="inline-flex items-center rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
                {payment.couponCode}
              </span>
            </div>
            <span className="text-sm font-medium text-success-600">
              -{formatVND(payment.couponDiscount)}
            </span>
          </div>
        )}

        <SummaryRow
          label="Phí vận chuyển"
          value={payment.shippingFee === 0 ? "Miễn phí" : formatVND(payment.shippingFee)}
          valueClass={payment.shippingFee === 0 ? "text-success-600" : "text-secondary-900"}
        />
      </div>

      {/* Total */}
      <div className="mt-auto flex items-center justify-between border-t border-secondary-100 pt-3">
        <span className="text-base font-semibold text-secondary-900">
          Tổng cộng
        </span>
        <span className="text-lg font-bold text-primary-600">
          {formatVND(payment.total)}
        </span>
      </div>

      {/* Payment method */}
      <div className="flex items-center justify-between border-t border-secondary-100 pt-3">
        <span className="text-sm text-secondary-500">Phương thức thanh toán</span>
        <span className="text-sm font-medium text-secondary-800">
          {payment.paymentMethod.name}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build an optimistic cancelled timeline from the existing timeline. */
function buildCancelledTimeline(
  timeline: TimelineEvent[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _reason: string
): TimelineEvent[] {
  return timeline.map((e, i) => ({
    ...e,
    completed: i === 0,
    timestamp: i === 0 ? e.timestamp : null,
  }));
}

/** Returns true if the order is within its return window. */
function isWithinReturnWindow(placedAt: string, windowDays: number): boolean {
  const placed = new Date(placedAt).getTime();
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  return now - placed <= windowMs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderDetailPageInnerProps {
  order: OrderDetail;
  initialReviewOpen?: boolean;
}

/**
 * OrderDetailPageInner — client root for /account/orders/[orderId].
 *
 * Layout (desktop):
 *   Row 1: [Items list card]      [Order timeline card]   — self-start (natural height)
 *   Row 2: [Payment summary card] [Shipping address card] — equal height via CSS grid row
 *
 * Both row-2 cards always have equal height regardless of content length,
 * because they share the same CSS grid row (align-items: stretch by default).
 */
export function OrderDetailPageInner({
  order,
  initialReviewOpen = false,
}: OrderDetailPageInnerProps) {
  // ── Optimistic cancel state ──────────────────────────────────────────────
  const [localStatus, setLocalStatus] = useState<OrderStatus>(order.status);
  const [localTimeline, setLocalTimeline] = useState<TimelineEvent[]>(order.timeline);
  const [localCancelReason, setLocalCancelReason] = useState<string | undefined>(
    order.cancelReason
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("Đơn hàng đã được hủy thành công.");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [reviewModalOpen, setReviewModalOpen] = useState(initialReviewOpen);

  const canCancel = localStatus === "pending";
  const canReturn =
    localStatus === "delivered" &&
    isWithinReturnWindow(order.placedAt, order.returnWindowDays);
  const canReview = localStatus === "delivered";

  const handleCancelConfirm = useCallback(
    async (reason: string) => {
      setIsCancelling(true);
      try {
        await cancelOrder(order.numericId);
        setLocalStatus("cancelled");
        setLocalTimeline(buildCancelledTimeline(order.timeline, reason));
        setLocalCancelReason(reason);
        setCancelModalOpen(false);
        setToastMessage("Đơn hàng đã được hủy thành công.");
        setToastType("success");
        setToastVisible(true);
      } catch (err) {
        setToastMessage(
          err instanceof Error ? err.message : "Hủy đơn thất bại.",
        );
        setToastType("error");
        setToastVisible(true);
      } finally {
        setIsCancelling(false);
      }
    },
    [order.numericId, order.timeline]
  );

  const placedAtFormatted = new Date(order.placedAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // Scroll the items list when there are more than 5 items
  const itemsScrollable = order.items.length > 5;

  return (
    <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronLeftIcon />}
          onClick={() => window.history.back()}
        >
          Đơn hàng của tôi
        </Button>
      </nav>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-secondary-900">
            Đơn hàng #{order.id}
          </h1>
          <p className="text-sm text-secondary-400">
            Đặt lúc{" "}
            <time dateTime={order.placedAt}>{placedAtFormatted}</time>
          </p>
          <OrderStatusBadge status={localStatus} />
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArchiveBoxXMarkIcon />}
              onClick={() => setCancelModalOpen(true)}
            >
              Hủy đơn
            </Button>
          )}
          {canReturn && (
            <Link href={`/account/orders/${order.numericId}/returns/new`}>
              <Button variant="outline" size="sm" leftIcon={<ArrowUturnLeftIcon />}>
                Yêu cầu hoàn trả
              </Button>
            </Link>
          )}
          {canReview && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setReviewModalOpen(true)}
            >
              Đánh giá sản phẩm
            </Button>
          )}
        </div>
      </div>

      {/* ── 4-cell grid ──────────────────────────────────────────────────── */}
      {/*
        Desktop: 2 columns, 2 rows.
          Row 1: Items card | Timeline card  — CSS grid stretches both to equal height.
                 flex-col on each card; items list grows (flex-1) to fill available space.
          Row 2: Payment card | Shipping card — equal height via CSS grid row stretch.
        Mobile: single column, natural stacking order.
      */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* ── Row 1 col 1 — Items list ──────────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-secondary-200 bg-white p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Sản phẩm đã đặt ({totalItemCount})
          </p>
          <div
            role="region"
            aria-label="Danh sách sản phẩm"
            tabIndex={itemsScrollable ? 0 : undefined}
            className={[
              "flex-1 divide-y divide-secondary-100 outline-none",
              itemsScrollable ? "max-h-[480px] overflow-y-auto pr-1 py-4" : "",
            ].filter(Boolean).join(" ")}
          >
            {order.items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* ── Row 1 col 2 — Order timeline ──────────────────────────────── */}
        <div className="flex flex-col rounded-2xl border border-secondary-200 bg-white p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Lịch sử đơn hàng
          </p>
          <div className="flex my-auto">
            <OrderTimeline
              events={localTimeline}
              orderStatus={localStatus}
              cancelReason={localCancelReason}
            />
          </div>
        </div>

        {/* ── Row 2 col 1 — Payment summary (equal height with shipping) ── */}
        <PaymentSummaryCard payment={order.payment} itemCount={totalItemCount} />

        {/* ── Row 2 col 2 — Shipping address (equal height with payment) ── */}
        <OrderShippingCard shipping={order.shipping} className="h-full" />
      </div>

      {/* ── Cancel modal ─────────────────────────────────────────────────── */}
      <OrderCancelModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
      />

      {/* ── Review modal ─────────────────────────────────────────────────── */}
      <OrderReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        order={order}
        onAllSubmitted={() => {
          setReviewModalOpen(false);
          setToastMessage("Cảm ơn! Đánh giá của bạn đã được ghi nhận.");
          setToastType("success");
          setToastVisible(true);
        }}
        onSubmitError={(message) => {
          setToastMessage(message);
          setToastType("error");
          setToastVisible(true);
        }}
      />

      {/* ── Success toast ─────────────────────────────────────────────────── */}
      <ToastMessage
        isVisible={toastVisible}
        type={toastType}
        message={toastMessage}
        position="top-right"
        duration={4000}
        onClose={() => setToastVisible(false)}
      />
    </main>
  );
}
