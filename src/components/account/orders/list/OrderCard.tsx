"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  StarIcon,
  ArrowUturnLeftIcon,
  XCircleIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { OrderStatusBadge } from "@/src/components/account/orders/shared/OrderStatusBadge";
import { OrderCancelModal } from "@/src/components/account/orders/modals/OrderCancelModal";
import { ReturnExpiredModal } from "@/src/components/account/orders/modals/ReturnExpiredModal";
import { ReviewExpiredModal } from "@/src/components/account/orders/modals/ReviewExpiredModal";
import { OrderReviewViewerModal } from "@/src/components/account/orders/modals/OrderReviewViewerModal";
import { canOrderBeReturned } from "@/src/lib/returns/eligibility";
import { cancelOrder } from "@/src/services/account-order.service";
import type { OrderSummary } from "@/src/types/account-order.types";
import type { ReturnRequest } from "@/src/types/account-return.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when today is within `windowDays` days of `deliveredAt`.
 * Returns false when `deliveredAt` is undefined.
 */
function isWithinDeliveryWindow(
  deliveredAt: string | undefined,
  windowDays: number
): boolean {
  if (!deliveredAt) return false;
  const delivered = new Date(deliveredAt);
  const deadline = new Date(delivered);
  deadline.setDate(deadline.getDate() + windowDays);
  return new Date() <= deadline;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

// Shared class strings that mirror Button sm-size variants (no asChild needed)
const LINK_BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "cursor-pointer select-none h-8 px-3 text-sm";

const LINK_BTN_GHOST =
  LINK_BTN_BASE +
  " bg-transparent text-secondary-600 hover:bg-secondary-100 active:bg-secondary-200 focus-visible:ring-secondary-400";

const LINK_BTN_OUTLINE =
  LINK_BTN_BASE +
  " bg-transparent text-primary-600 border border-primary-400 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderCardProps {
  order: OrderSummary;
  onCancelSuccess: (id: string) => void;
  /** Yêu cầu đổi/trả liên quan đến đơn này (mặc định rỗng khi chưa wire Returns). */
  returnRequests?: ReturnRequest[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderCard — summary card for a single order shown in the orders list.
 *
 * Action buttons (only shown for delivered orders with a `deliveredAt` date):
 * - "Đổi/Trả": navigates within 7-day window; opens expiry modal after
 * - "Đánh giá" / "Xem đánh giá": navigates / opens viewer within 15-day window
 *   reviewing is always viewable; only submitting is time-gated
 */
export function OrderCard({ order, onCancelSuccess, returnRequests = [] }: OrderCardProps) {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [returnExpiredOpen, setReturnExpiredOpen] = useState(false);
  const [reviewExpiredOpen, setReviewExpiredOpen] = useState(false);
  const [reviewViewerOpen, setReviewViewerOpen] = useState(false);

  const canCancel = order.status === "pending";

  // Delivered orders with a confirmed delivery date get time-gated action buttons
  const hasDeliveredAt =
    order.status === "delivered" && !!order.deliveredAt;
  const returnWithinWindow = isWithinDeliveryWindow(
    order.deliveredAt,
    order.returnWindowDays ?? 7
  );
  const reviewWithinWindow = isWithinDeliveryWindow(
    order.deliveredAt,
    order.reviewWindowDays ?? 15
  );
  const hasReview = !!order.review;

  // Per-item eligibility: check if there's anything left to return
  const orderRequests = returnRequests.filter((r) => r.orderId === order.id);
  const hasExistingRequests = orderRequests.length > 0;
  const hasEligibleItems = canOrderBeReturned(order, orderRequests);

  const hasActions = canCancel || hasDeliveredAt;

  const handleCancelConfirm = async (_reason: string) => {
    setIsCancelling(true);
    try {
      await cancelOrder(order.numericId);
      setCancelModalOpen(false);
      onCancelSuccess(order.id);
    } finally {
      setIsCancelling(false);
    }
  };

  // Show at most 3 product thumbnails; remainder shown as "+N"
  const visibleItems = order.items.slice(0, 3);
  const extraCount = order.items.length - visibleItems.length;

  return (
    <>
      <article className="rounded-xl border border-secondary-200 bg-white overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-100 px-4 py-3 bg-secondary-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-secondary-900">
              {order.id}
            </span>
            <span className="text-xs text-secondary-400">
              {formatDate(order.placedAt)}
            </span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="px-4 py-4 space-y-3">
          {/* Product thumbnails + total */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  className="relative h-14 w-14 shrink-0 rounded-lg border border-secondary-100 overflow-hidden bg-secondary-50"
                >
                  <Image
                    src={item.thumbnailSrc}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] font-medium text-white leading-4">
                      ×{item.quantity}
                    </span>
                  )}
                </div>
              ))}

              {extraCount > 0 && (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 text-xs font-medium text-secondary-500">
                  +{extraCount}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className="text-base font-bold text-secondary-900">
                {formatCurrency(order.total)}
              </p>
              <p className="text-xs text-secondary-400">
                {order.itemCount} sản phẩm
              </p>
            </div>
          </div>

          {/* First product name summary */}
          <p className="text-sm text-secondary-600 line-clamp-1">
            {order.items[0].name}
            {order.items.length > 1 &&
              ` và ${order.items.length - 1} sản phẩm khác`}
          </p>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-secondary-100 px-4 py-3">
          <Link
            href={`/account/orders/${order.numericId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Xem chi tiết
            <ChevronRightIcon className="h-4 w-4" />
          </Link>

          {hasActions && (
            <div className="flex flex-wrap items-center gap-2">
              {/* ── Cancel ────────────────────────────────────────────── */}
              {canCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <XCircleIcon className="h-4 w-4" />
                  Hủy đơn
                </Button>
              )}

              {/* ── Return ────────────────────────────────────────────── */}
              {hasDeliveredAt && (
                returnWithinWindow ? (
                  hasEligibleItems ? (
                    // Active: within window + eligible items remain
                    <Link
                      href={`/account/orders/${order.numericId}/returns/new`}
                      className={LINK_BTN_GHOST}
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      Đổi/Trả
                    </Link>
                  ) : (
                    // Disabled: within window but all items already in active requests
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title="Tất cả sản phẩm đã được yêu cầu trả hàng"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      Đổi/Trả
                    </Button>
                  )
                ) : (
                  // Expired window
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReturnExpiredOpen(true)}
                  >
                    <ArrowUturnLeftIcon className="h-4 w-4" />
                    Đổi/Trả
                  </Button>
                )
              )}

              {/* ── Review ────────────────────────────────────────────── */}
              {hasDeliveredAt && (
                hasReview ? (
                  // Always allow viewing the submitted review
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewViewerOpen(true)}
                  >
                    <StarIcon className="h-4 w-4" />
                    Xem đánh giá
                  </Button>
                ) : reviewWithinWindow ? (
                  <Link
                    href={`/account/orders/${order.numericId}?action=review`}
                    className={LINK_BTN_OUTLINE}
                  >
                    <StarIcon className="h-4 w-4" />
                    Đánh giá
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewExpiredOpen(true)}
                  >
                    <StarIcon className="h-4 w-4" />
                    Đánh giá
                  </Button>
                )
              )}

              {/* ── View existing return requests ──────────────────────── */}
              {hasDeliveredAt && hasExistingRequests && (
                <Link
                  href="/account/returns"
                  className={LINK_BTN_GHOST}
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  Xem yêu cầu trả hàng
                </Link>
              )}
            </div>
          )}
        </div>
      </article>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {canCancel && (
        <OrderCancelModal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
          isLoading={isCancelling}
        />
      )}

      {hasDeliveredAt && (
        <>
          <ReturnExpiredModal
            isOpen={returnExpiredOpen}
            onClose={() => setReturnExpiredOpen(false)}
          />
          <ReviewExpiredModal
            isOpen={reviewExpiredOpen}
            onClose={() => setReviewExpiredOpen(false)}
          />
          {hasReview && order.review && (
            <OrderReviewViewerModal
              isOpen={reviewViewerOpen}
              onClose={() => setReviewViewerOpen(false)}
              review={order.review}
            />
          )}
        </>
      )}
    </>
  );
}
