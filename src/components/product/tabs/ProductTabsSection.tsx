"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DescriptionTab } from "@/src/components/product/tabs/DescriptionTab";
import { SpecTable } from "@/src/components/product/tabs/SpecTable";
import { ReviewSection } from "@/src/components/product/reviews/ReviewSection";
import type { ProductDetail, SpecGroup } from "@/src/components/product/types";
import { getVariantSpecs } from "@/src/services/product-detail.service";

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

type TabValue = "description" | "specs" | "warranty" | "reviews";

interface SelectedVariantPayload {
  id: string;
  warrantyMonths: number | null;
  warrantyPolicy: string | null;
  description?: string | null;
  images?: unknown;
}

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

  // ── Selected-variant tracking — drives the warranty tab content ──────────
  // Seed from the default-or-first variant option so server-render shows
  // something sensible even before the hero dispatches an update.
  const initialWarranty = (() => {
    const opts = product.variantGroups.find((g) => g.key === "variant")?.options
      ?? product.variantGroups[0]?.options
      ?? [];
    const first = opts[0];
    return {
      months: first?.warrantyMonths ?? null,
      policy: first?.warrantyPolicy ?? null,
    };
  })();
  const [warrantyMonths, setWarrantyMonths] = useState<number | null>(initialWarranty.months);
  const [warrantyPolicy, setWarrantyPolicy] = useState<string | null>(initialWarranty.policy);
  const [descriptionHtml, setDescriptionHtml] = useState<string>(product.descriptionHtml);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>(product.specGroups);

  const latestSpecsVariantRef = useRef<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<SelectedVariantPayload>).detail;
      if (!detail) return;
      setWarrantyMonths(detail.warrantyMonths);
      setWarrantyPolicy(detail.warrantyPolicy);
      // Always reflect the selected variant's description — even when empty,
      // so switching from a variant that has content to one without correctly
      // clears the panel instead of leaving stale HTML from the previous variant.
      setDescriptionHtml(detail.description ?? "");
      // Fetch specs for the newly selected variant. Track the latest requested
      // variant id so a slow in-flight response can't overwrite a newer one.
      if (detail.id) {
        latestSpecsVariantRef.current = detail.id;
        const requestedId = detail.id;
        getVariantSpecs(requestedId)
          .then((groups) => {
            if (latestSpecsVariantRef.current === requestedId) setSpecGroups(groups);
          })
          .catch(() => {
            if (latestSpecsVariantRef.current === requestedId) setSpecGroups([]);
          });
      }
    };
    window.addEventListener("selectedVariantChange", handler);
    return () => window.removeEventListener("selectedVariantChange", handler);
  }, []);

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
    { value: "warranty", label: "Chính sách bảo hành" },
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
            descriptionHtml.trim().length > 0 ? (
              <DescriptionTab htmlContent={descriptionHtml} />
            ) : (
              <p className="text-sm text-secondary-500">
                Phiên bản này chưa có mô tả chi tiết.
              </p>
            )
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
            specGroups.length > 0 ? (
              <div className="flex flex-col gap-8">
                {specGroups.map((group) => (
                  <div key={group.heading}>
                    <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wide mb-3">
                      {group.heading}
                    </h3>
                    <SpecTable specs={group.rows} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-500">
                Phiên bản này chưa có thông số kỹ thuật.
              </p>
            )
          )}
        </div>

        {/* Warranty */}
        <div
          id={`${baseId}-panel-warranty`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-warranty`}
          hidden={activeTab !== "warranty"}
        >
          {activeTab === "warranty" && (
            <div className="flex flex-col gap-4">
              {warrantyMonths != null && warrantyMonths > 0 && (
                <p className="text-sm text-secondary-700">
                  Thời gian bảo hành: <span className="font-semibold text-secondary-900">{warrantyMonths} tháng</span>
                </p>
              )}
              {warrantyPolicy && warrantyPolicy.trim().length > 0 ? (
                <div
                  className="prose prose-sm max-w-none text-secondary-700"
                  dangerouslySetInnerHTML={{ __html: warrantyPolicy }}
                />
              ) : (
                <p className="text-sm text-secondary-500">
                  Phiên bản này chưa có chính sách bảo hành chi tiết.
                </p>
              )}
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
