import { Breadcrumb } from "@/src/components/navigation/Breadcrumb";
import { ProductImageGallery } from "@/src/components/product/hero/ProductImageGallery";
import { RatingScrollButton } from "@/src/components/product/hero/RatingScrollButton";
import { ProductHeroClient } from "@/src/components/product/hero/ProductHeroClient";
import type { ProductDetail } from "@/src/components/product/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductHeroSectionProps {
  product: ProductDetail;
  /** Fresh review count from the reviews endpoint — see [[ProductTabsSection]]. */
  totalReviews?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductHeroSection — server component shell that composes the 2-column
 * product hero layout. The interactive right column is delegated to
 * ProductHeroClient (client component).
 */
export function ProductHeroSection({ product, totalReviews }: ProductHeroSectionProps) {
  const firstImage = product.images[0];
  const reviewCount = totalReviews ?? product.reviewCount;

  return (
    <section className="bg-white border-b border-secondary-200">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb — full width */}
        <Breadcrumb
          showHome
          items={[
            { label: "Laptop", href: "/products?category=laptop" },
            { label: product.brand, href: `/products?brand=${encodeURIComponent(product.brand)}` },
            { label: product.name },
          ]}
          className="mb-5"
        />

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ── LEFT: Image gallery ── */}
          <div className="lg:col-span-6">
            <ProductImageGallery
              items={product.images}
              defaultIndex={0}
              className="lg:sticky lg:top-24"
            />
          </div>

          {/* ── RIGHT: Product info (client interactive) ── */}
          <div className="lg:col-span-6">
            <ProductHeroClient
              product={product}
              thumbnailSrc={firstImage?.src ?? ""}
              ratingSlot={
                <RatingScrollButton
                  value={product.rating}
                  count={reviewCount}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile padding so sticky bottom bar doesn't overlap content */}
      <div className="lg:hidden h-20" aria-hidden="true" />
    </section>
  );
}
