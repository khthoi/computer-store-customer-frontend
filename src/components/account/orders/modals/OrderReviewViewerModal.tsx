"use client";

import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import type { OrderReview } from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderReviewViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: OrderReview;
}

/**
 * OrderReviewViewerModal — displays the user's submitted review for an order.
 * Read-only; no edit functionality.
 */
export function OrderReviewViewerModal({
  isOpen,
  onClose,
  review,
}: OrderReviewViewerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh giá của bạn"
      size="md"
      animated
      footer={
        <Button variant="ghost" size="md" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Product info */}
        <div className="rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3">
          <p className="text-sm font-semibold text-secondary-900">
            {review.productName}
          </p>
          <p className="mt-0.5 text-xs text-secondary-400">
            {review.variantLabel}
          </p>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const filled = i < review.rating;
            return filled ? (
              <StarSolid
                key={i}
                className="h-5 w-5 text-amber-400"
                aria-hidden="true"
              />
            ) : (
              <StarOutline
                key={i}
                className="h-5 w-5 text-secondary-300"
                aria-hidden="true"
              />
            );
          })}
          <span className="ml-2 text-sm font-medium text-secondary-700">
            {review.rating}/5
          </span>
        </div>

        {/* Comment */}
        <p className="text-sm leading-relaxed text-secondary-700">
          {review.comment}
        </p>

        {/* Date */}
        <p className="text-xs text-secondary-400">
          Đã đánh giá ngày {formatDate(review.reviewedAt)}
        </p>
      </div>
    </Modal>
  );
}
