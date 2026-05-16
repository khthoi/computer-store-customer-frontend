"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { DescriptionTab } from "@/src/components/product/DescriptionTab";
import { SpecTable } from "@/src/components/product/SpecTable";
import { ReviewSection } from "@/src/components/product/ReviewSection";
import type { ProductDetail } from "@/src/components/product/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductTabsSectionProps {
  product: ProductDetail;
  /**
   * Fresh review count from `/products/:id/reviews?page=1`. Use this instead of
   * `product.reviewCount` (which reads from a cached column that can lag the
   * actual approved-review count when reviews exist on non-default variants).
   */
  totalReviews?: number;
}

type TabValue = "description" | "specs" | "reviews";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductTabsSection — full-width tabs block.
 * Implements its own tab bar so the sticky header and the panel content
 * can be rendered in separate DOM positions. Listens for the custom
 * 'switchTab' CustomEvent dispatched by ProductHeroClient.
 */
export function ProductTabsSection({ product, totalReviews }: ProductTabsSectionProps) {
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<TabValue>("description");
  const reviewCount = totalReviews ?? product.reviewCount;

  // Listen for cross-component tab-switching (dispatched from rating star click)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TabValue>).detail;
      if (detail) {
        setActiveTab(detail);
        // Scroll tab section into view
        document
          .getElementById("product-tabs")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("switchTab", handler);
    return () => window.removeEventListener("switchTab", handler);
  }, []);

  const handleTabClick = useCallback((value: TabValue) => {
    setActiveTab(value);
  }, []);

  const tabs: Array<{ value: TabValue; label: string }> = [
    { value: "description", label: "Mô tả sản phẩm" },
    { value: "specs", label: "Thông số kỹ thuật" },
    { value: "reviews", label: `Đánh giá (${reviewCount})` },
  ];

  return (
    <section id="product-tabs" className="bg-white mt-4">
      {/* ── Sticky tab bar ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-secondary-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            role="tablist"
            aria-label="Thông tin sản phẩm"
            className="flex overflow-x-auto gap-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => {
              const isActive = tab.value === activeTab;
              return (
                <button
                  key={tab.value}
                  id={`${baseId}-tab-${tab.value}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${baseId}-panel-${tab.value}`}
                  type="button"
                  onClick={() => handleTabClick(tab.value)}
                  className={[
                    "shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-150",
                    "border-b-2 -mb-px",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
                    isActive
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300",
                  ].join(" ")}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab panels ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Description */}
        <div
          id={`${baseId}-panel-description`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-description`}
          hidden={activeTab !== "description"}
        >
          {activeTab === "description" && (
            <DescriptionTab htmlContent={product.descriptionHtml} />
          )}
        </div>

        {/* Specifications */}
        <div
          id={`${baseId}-panel-specs`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-specs`}
          hidden={activeTab !== "specs"}
        >
          {activeTab === "specs" && (
            <div className="flex flex-col gap-8">
              {product.specGroups.map((group) => (
                <div key={group.heading}>
                  <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wide mb-3">
                    {group.heading}
                  </h3>
                  <SpecTable specs={group.rows} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div
          id={`${baseId}-panel-reviews`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-reviews`}
          hidden={activeTab !== "reviews"}
        >
          {activeTab === "reviews" && (
            <ReviewSection
              productId={product.id}
              initialReviews={product.reviews}
              ratingDistribution={product.ratingDistribution}
              averageRating={product.rating}
              totalReviews={reviewCount}
              canReview={false}
            />
          )}
        </div>

      </div>
    </section>
  );
}
