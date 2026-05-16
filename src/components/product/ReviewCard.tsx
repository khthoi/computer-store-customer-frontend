"use client";

import { useState } from "react";
import { CheckBadgeIcon, BuildingStorefrontIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge, type BadgeVariant } from "@/src/components/ui/Badge";
import { Lightbox, type LightboxItem } from "@/src/components/ui/Lightbox";
import { RatingStars } from "@/src/components/product/RatingStars";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewResponseRole = "seller" | "support" | "admin";

export interface ReviewResponse {
  id: string;
  authorName: string;
  avatarUrl?: string;
  role: ReviewResponseRole;
  content: string;
  /** ISO date string */
  createdAt: string;
}

export interface Review {
  id: string;
  /** Pre-masked name e.g. "Nguyễn V*** T***" */
  authorName: string;
  avatarUrl?: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  /** e.g. "RAM 16GB / SSD 512GB" */
  purchasedVariant?: string;
  helpfulCount: number;
  /** ISO date string */
  createdAt: string;
  isVerifiedPurchase: boolean;
  /** Optional seller / staff responses to this review */
  responses?: ReviewResponse[];
}

export interface ReviewCardProps {
  review: Review;
}

// ─── Response role config ──────────────────────────────────────────────────────

const RESPONSE_ROLE_CONFIG: Record<
  ReviewResponseRole,
  { label: string; variant: BadgeVariant }
> = {
  seller:  { label: "Người bán",       variant: "primary" },
  support: { label: "CSKH",            variant: "info"    },
  admin:   { label: "Quản trị viên",   variant: "warning" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ─── ReviewCard ────────────────────────────────────────────────────────────────

export function ReviewCard({ review }: ReviewCardProps) {
  // null = closed; number = index of the image to show first in the Lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Build Lightbox items from all review images (not just the visible slice)
  const lightboxItems: LightboxItem[] = (review.images ?? []).map((src, i) => ({
    key: `review-${review.id}-img-${i}`,
    src,
    alt: `Ảnh đánh giá ${i + 1}`,
  }));

  // Show at most 5 thumbnails; the last slot becomes a "+N" button that opens
  // the lightbox at the first hidden image (index maxImages).
  const maxImages = 5;
  const visibleImages = review.images?.slice(0, maxImages) ?? [];
  const extraImages =
    (review.images?.length ?? 0) > maxImages
      ? (review.images?.length ?? 0) - maxImages
      : 0;

  return (
    <article className="bg-white rounded-xl border border-secondary-200 p-5 hover:shadow-md transition-shadow duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            src={review.avatarUrl}
            name={review.authorName}
            size="md"
            shape="circle"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-secondary-900 truncate">
              {review.authorName}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {review.isVerifiedPurchase && (
                <Badge variant="success" size="sm">
                  <CheckBadgeIcon className="w-3 h-3 mr-0.5" aria-hidden="true" />
                  Đã mua hàng
                </Badge>
              )}
              {review.purchasedVariant && (
                <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full">
                  {review.purchasedVariant}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <RatingStars value={review.rating} mode="display" size="sm" />
          <time
            dateTime={review.createdAt}
            className="text-xs text-secondary-400"
          >
            {formatDate(review.createdAt)}
          </time>
        </div>
      </div>

      {/* Review title */}
      {review.title && (
        <p className="mt-3 text-sm font-semibold text-secondary-900">
          {review.title}
        </p>
      )}

      {/* Review content */}
      <p className="mt-2 text-sm text-secondary-700 leading-relaxed whitespace-pre-line">
        {review.content}
      </p>

      {/* Review images */}
      {visibleImages.length > 0 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {visibleImages.map((src, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Xem ảnh đánh giá ${idx + 1}`}
              onClick={() => setLightboxIndex(idx)}
              className="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Ảnh đánh giá ${idx + 1}`}
                loading="lazy"
                width={72}
                height={72}
                className="w-[72px] h-[72px] rounded-lg object-cover border border-secondary-200 hover:opacity-80 transition-opacity"
              />
            </button>
          ))}
          {extraImages > 0 && (
            // Opens the lightbox at the first image that wasn't shown as a thumbnail
            <button
              type="button"
              aria-label={`Xem thêm ${extraImages} ảnh`}
              onClick={() => setLightboxIndex(maxImages)}
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg bg-secondary-100 text-sm font-medium text-secondary-600 hover:bg-secondary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              +{extraImages}
            </button>
          )}
        </div>
      )}

      {/* Seller / staff responses */}
      {review.responses && review.responses.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-lg border border-secondary-200 bg-secondary-50">
          {/* Section header */}
          <div className="flex items-center gap-1.5 border-b border-secondary-200 px-4 py-2">
            <BuildingStorefrontIcon
              className="h-3.5 w-3.5 shrink-0 text-secondary-400"
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-secondary-500">
              Phản hồi từ cửa hàng
            </span>
          </div>

          {/* Individual responses */}
          {review.responses.map((resp, i) => {
            const cfg = RESPONSE_ROLE_CONFIG[resp.role];
            return (
              <div
                key={resp.id}
                className={[
                  "px-4 py-3",
                  i > 0 ? "border-t border-secondary-200" : "",
                ].join(" ")}
              >
                {/* Response header: avatar · name · role badge · date */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      src={resp.avatarUrl}
                      name={resp.authorName}
                      size="xs"
                      shape="circle"
                    />
                    <span className="text-xs font-semibold text-secondary-800 truncate">
                      {resp.authorName}
                    </span>
                    <Badge variant={cfg.variant} size="sm">
                      {cfg.label}
                    </Badge>
                  </div>
                  <time
                    dateTime={resp.createdAt}
                    className="shrink-0 text-[10px] text-secondary-400"
                  >
                    {formatDate(resp.createdAt)}
                  </time>
                </div>

                {/* Response content */}
                <p className="mt-1.5 text-sm leading-relaxed text-secondary-700">
                  {resp.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Image lightbox — full navigation across all review images */}
      {lightboxIndex !== null && (
        <Lightbox
          items={lightboxItems}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </article>
  );
}
