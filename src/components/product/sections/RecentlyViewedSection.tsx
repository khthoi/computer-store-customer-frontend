import { ProductCarousel } from "@/src/components/product/card/ProductCarousel";
import type { ProductCardProps } from "@/src/components/product/card/ProductCard";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentlyViewedSectionProps {
  products: ProductCardProps[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RecentlyViewedSection({ products }: RecentlyViewedSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-10 bg-secondary-50 border-t border-secondary-200">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-secondary-900 mb-5">
          Sản phẩm đã xem
        </h2>
        <ProductCarousel products={products} itemsPerView={5} />
      </div>
    </section>
  );
}
