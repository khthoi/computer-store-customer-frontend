"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StarIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Pagination } from "@/src/components/navigation/Pagination";
import { RatingStars } from "@/src/components/product/atoms/RatingStars";
import { ReviewCard, type Review } from "@/src/components/product/reviews/ReviewCard";
import { ReviewFormModal } from "@/src/components/product/reviews/ReviewFormModal";
import { getProductReviews } from "@/src/services/product-detail.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface ReviewSectionProps {
  productId: string;
  initialReviews: Review[];
  ratingDistribution: RatingDistribution;
  averageRating: number;
  totalReviews: number;
  /** true if user is logged-in and has purchased this product */
  canReview?: boolean;
}

type StarFilter = 0 | 1 | 2 | 3 | 4 | 5;
type SpecialFilter = "images";

const REVIEWS_PER_PAGE = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewSection({
  productId,
  initialReviews,
  ratingDistribution,
  averageRating,
  totalReviews,
  canReview = false,
}: ReviewSectionProps) {
  const [starFilter, setStarFilter] = useState<StarFilter>(0);
  const [specialFilter, setSpecialFilter] = useState<SpecialFilter | null>(null);
  const [page, setPage] = useState(1);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  // Filtered total — drives the Pagination button count. Starts equal to the
  // unfiltered total (rendered by the parent) and is replaced by every fetch.
  const [filteredTotal, setFilteredTotal] = useState<number>(totalReviews);
  const [loadingPage, setLoadingPage] = useState(false);
  const isFirstRender = useRef(true);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / REVIEWS_PER_PAGE));

  // Refetch whenever page OR a filter changes. Filters are applied server-side
  // so paginating across all filtered results works correctly.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoadingPage(true);
    getProductReviews(productId, page, REVIEWS_PER_PAGE, {
      rating: starFilter === 0 ? undefined : starFilter,
      hasImages: specialFilter === "images" ? true : undefined,
    })
      .then((result) => {
        if (cancelled) return;
        setReviews(result.items);
        setFilteredTotal(result.total);
      })
      .catch(() => {
        if (cancelled) return;
        setReviews([]);
        setFilteredTotal(0);
      })
      .finally(() => {
        if (!cancelled) setLoadingPage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, productId, starFilter, specialFilter]);

  const paginatedReviews = reviews;

  const handleStarFilter = useCallback(
    (star: StarFilter) => {
      setStarFilter(star);
      setSpecialFilter(null);
      setPage(1);
    },
    []
  );

  const handleSpecialFilter = useCallback(
    (filter: SpecialFilter) => {
      setSpecialFilter((prev) => (prev === filter ? null : filter));
      setStarFilter(0);
      setPage(1);
    },
    []
  );

  // Total for bar max
  const maxBarCount = Math.max(
    ratingDistribution[5],
    ratingDistribution[4],
    ratingDistribution[3],
    ratingDistribution[2],
    ratingDistribution[1],
    1
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Left panel: Rating Summary ── */}
      <div className="lg:w-56 shrink-0 flex flex-col items-center lg:items-start gap-4">
        {/* Average score */}
        <div className="text-center lg:text-left">
          <p className="text-5xl font-bold text-secondary-900 leading-none">
            {averageRating.toFixed(1)}
          </p>
          <div className="mt-2">
            <RatingStars value={averageRating} mode="display" size="lg" />
          </div>
          <p className="mt-1 text-sm text-secondary-500">
            {totalReviews.toLocaleString()} đánh giá
          </p>
        </div>

        {/* Distribution bars */}
        <div className="w-full flex flex-col gap-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = ratingDistribution[star];
            const pct = Math.round((count / maxBarCount) * 100);
            return (
              <button
                key={star}
                type="button"
                aria-label={`Lọc ${star} sao (${count} đánh giá)`}
                onClick={() => handleStarFilter(star as StarFilter)}
                className={[
                  "flex items-center gap-2 w-full rounded-md px-1 py-0.5 transition-colors text-sm",
                  starFilter === star
                    ? "bg-warning-50 ring-1 ring-warning-300"
                    : "hover:bg-secondary-50",
                ].join(" ")}
              >
                <span className="w-4 text-right text-secondary-600 shrink-0">
                  {star}
                </span>
                <StarIcon className="w-3.5 h-3.5 text-warning-400 shrink-0" aria-hidden="true" />
                <div className="flex-1 h-2 rounded-full bg-secondary-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning-400 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                </div>
                <span className="w-6 text-right text-xs text-secondary-500 shrink-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Write review button (desktop) */}
        {canReview && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PencilSquareIcon className="w-4 h-4" />}
            onClick={() => setReviewModalOpen(true)}
            className="hidden lg:inline-flex"
          >
            Viết đánh giá
          </Button>
        )}
      </div>

      {/* ── Right panel: Filters + List ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* All */}
          <button
            type="button"
            onClick={() => handleStarFilter(0)}
            className={[
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              starFilter === 0 && specialFilter === null
                ? "bg-primary-600 text-white border-primary-600"
                : "border-secondary-300 text-secondary-700 hover:bg-secondary-50",
            ].join(" ")}
          >
            Tất cả
          </button>

          {/* Star filters */}
          {([5, 4, 3, 2, 1] as const).map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleStarFilter(star as StarFilter)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                starFilter === star
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-secondary-300 text-secondary-700 hover:bg-secondary-50",
              ].join(" ")}
            >
              {star}★
            </button>
          ))}

          {/* Images filter */}
          <button
            type="button"
            onClick={() => handleSpecialFilter("images")}
            className={[
              "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
              specialFilter === "images"
                ? "bg-primary-600 text-white border-primary-600"
                : "border-secondary-300 text-secondary-700 hover:bg-secondary-50",
            ].join(" ")}
          >
            Có hình ảnh
          </button>

          {/* Write review button (mobile) */}
          {canReview && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<PencilSquareIcon className="w-4 h-4" />}
              onClick={() => setReviewModalOpen(true)}
              className="lg:hidden ml-auto"
            >
              Viết đánh giá
            </Button>
          )}
        </div>

        {/* Review list */}
        {paginatedReviews.length > 0 ? (
          <div
            className={[
              "flex flex-col gap-4 transition-opacity",
              loadingPage ? "opacity-50" : "opacity-100",
            ].join(" ")}
          >
            {paginatedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <StarIcon className="w-12 h-12 text-secondary-300" aria-hidden="true" />
            <p className="text-secondary-500">
              {starFilter !== 0 || specialFilter
                ? "Không có đánh giá phù hợp với bộ lọc."
                : "Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ!"}
            </p>
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PencilSquareIcon className="w-4 h-4" />}
                onClick={() => setReviewModalOpen(true)}
              >
                Viết đánh giá
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-2 flex justify-center">
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                document
                  .getElementById("reviews")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            />
          </div>
        )}
      </div>

      {/* Review form modal */}
      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={productId}
        productName="Sản phẩm này"
      />
    </div>
  );
}
