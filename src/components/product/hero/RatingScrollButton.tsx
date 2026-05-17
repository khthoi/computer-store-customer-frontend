"use client";

import { useCallback } from "react";
import { RatingStars } from "@/src/components/product/atoms/RatingStars";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RatingScrollButtonProps {
  value: number;
  count: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RatingScrollButton — clicking the rating stars dispatches a 'switchTab'
 * event to open the reviews tab and scrolls the page to #product-tabs.
 */
export function RatingScrollButton({ value, count }: RatingScrollButtonProps) {
  const handleClick = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent("switchTab", { detail: "reviews" })
    );
  }, []);

  return (
    <button
      type="button"
      aria-label="Xem đánh giá sản phẩm"
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 hover:opacity-80 transition-opacity"
    >
      <RatingStars value={value} count={count} mode="display" size="md" />
    </button>
  );
}
