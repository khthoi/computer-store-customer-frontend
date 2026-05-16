"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import {
  ProductReviewCard,
  type ProductReviewCardHandle,
  type ProductReviewFormData,
} from "@/src/components/account/orders/ProductReviewCard";
import { submitProductReview } from "@/src/services/account-review.service";
import type {
  OrderDetail,
  OrderDetailItem,
} from "@/src/types/account-order.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetail;
  onAllSubmitted?: () => void;
  /** Called when a per-item submission fails — parent shows the toast. */
  onSubmitError?: (message: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderReviewModal — multi-product review modal for a delivered order.
 *
 * Renders one `ProductReviewCard` per order item. Items that already have
 * a `review` show a read-only success state immediately. After all items
 * are reviewed (including those already reviewed at open time only if NEW
 * submissions occurred), `onAllSubmitted` is called.
 *
 * Exposes a "Gửi tất cả đánh giá" bulk footer button when 2+ items are pending.
 */
export function OrderReviewModal({
  isOpen,
  onClose,
  order,
  onAllSubmitted,
  onSubmitError,
}: OrderReviewModalProps) {
  const [localItems, setLocalItems] = useState<OrderDetailItem[]>(order.items);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  // Track how many items were submitted during this modal session
  const [submittedCount, setSubmittedCount] = useState(0);

  // Stable ref to latest onAllSubmitted to avoid stale closure issues
  const onAllSubmittedRef = useRef(onAllSubmitted);
  useEffect(() => {
    onAllSubmittedRef.current = onAllSubmitted;
  }, [onAllSubmitted]);

  // Re-initialize when the order prop changes (e.g., modal re-opened for a different order)
  useEffect(() => {
    setLocalItems(order.items);
    setSubmittedCount(0);
  }, [order.items]);

  // Refs to each card's imperative handle for bulk submission
  const cardRefs = useRef<Map<string, ProductReviewCardHandle>>(new Map());

  // Fire onAllSubmitted only when items transition to all-reviewed during this session
  useEffect(() => {
    if (
      submittedCount > 0 &&
      localItems.length > 0 &&
      localItems.every((i) => i.review !== undefined)
    ) {
      onAllSubmittedRef.current?.();
    }
  }, [localItems, submittedCount]);

  // ── Per-item submit handler ────────────────────────────────────────────────

  const handleItemSubmit = useCallback(
    async (itemId: string, data: ProductReviewFormData) => {
      const target = order.items.find((i) => i.id === itemId);
      if (!target) return;
      const variantIdNum = Number(target.variantId);
      if (!Number.isFinite(variantIdNum) || variantIdNum <= 0) {
        onSubmitError?.("Không xác định được phiên bản sản phẩm.");
        throw new Error("invalid variantId");
      }

      try {
        const review = await submitProductReview({
          itemId,
          orderId: order.numericId,
          variantId: variantIdNum,
          rating: data.rating,
          title: data.title || undefined,
          content: data.content,
          images: data.files,
        });

        setLocalItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, review } : item)),
        );
        setSubmittedCount((c) => c + 1);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gửi đánh giá thất bại.";
        onSubmitError?.(message);
        // Re-throw so ProductReviewCard's bulk-submit loop can decide whether
        // to keep iterating; the card's own isSubmitting state is reset in its
        // finally block regardless.
        throw err;
      }
    },
    [order.items, order.numericId, onSubmitError],
  );

  // ── Bulk submit ────────────────────────────────────────────────────────────

  const handleBulkSubmit = useCallback(async () => {
    // Capture pending items at click time
    const pending = localItems.filter((item) => !item.review);
    setIsBulkSubmitting(true);
    try {
      for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        await cardRefs.current.get(item.id)?.triggerSubmit();
        // Staggered delay between items (not after the last one)
        if (i < pending.length - 1) {
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    } finally {
      setIsBulkSubmitting(false);
    }
  }, [localItems]);

  // ── Footer ─────────────────────────────────────────────────────────────────

  const pendingCount = localItems.filter((item) => !item.review).length;
  const footer =
    pendingCount >= 2 ? (
      <Button
        variant="primary"
        fullWidth
        isLoading={isBulkSubmitting}
        disabled={isBulkSubmitting}
        onClick={handleBulkSubmit}
      >
        Gửi tất cả đánh giá
      </Button>
    ) : undefined;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh giá sản phẩm"
      size="xl"
      animated
      footer={footer}
    >
      <div className="flex flex-col">
        {localItems.map((item, idx) => (
          <div
            key={item.id}
            className={[
              "py-5",
              idx < localItems.length - 1
                ? "border-b border-secondary-100"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <ProductReviewCard
              ref={(handle) => {
                if (handle) cardRefs.current.set(item.id, handle);
                else cardRefs.current.delete(item.id);
              }}
              item={item}
              onSubmit={handleItemSubmit}
              disabled={isBulkSubmitting}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}
