import { ProductCarousel } from "@/src/components/product/card/ProductCarousel";
import type { ProductCardProps } from "@/src/components/product/card/ProductCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type DealProduct = Omit<ProductCardProps, "onAddToCart" | "onCompare" | "onWishlistToggle">;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DealSection — renders a ProductCarousel for a given deal group.
 *
 * Kept as a dedicated component so future enhancements (sorting, "view all"
 * link, pagination) can be added here without touching the parent page.
 */
export function DealSection({ products }: { products: DealProduct[] }) {
  return (
    <div className="py-4">
      <ProductCarousel products={products} itemsPerView={6} />
    </div>
  );
}
