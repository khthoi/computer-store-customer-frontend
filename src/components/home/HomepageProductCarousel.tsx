import Link from "next/link";
import { ProductCarousel } from "@/src/components/product/ProductCarousel";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

interface HomepageProductCarouselProps {
  title: string;
  href?: string;
  badgeNode?: React.ReactNode;
  products: StorefrontProductCardDto[];
}

export function HomepageProductCarousel({
  title,
  href,
  badgeNode,
  products,
}: HomepageProductCarouselProps) {
  if (!products.length) return null;

  return (
    <section
      aria-labelledby={`hps-${title}`}
      className="py-6 bg-secondary-50 max-w-[1400px] mx-auto flex items-center"
    >
      <div className="w-full 2xl:max-w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 id={`hps-${title}`} className="text-lg font-bold text-secondary-900">
              {title}
            </h2>
            {badgeNode}
          </div>
          {href && (
            <Link
              href={href}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Xem tất cả →
            </Link>
          )}
        </div>
        <ProductCarousel products={[]} dtos={products} />
      </div>
    </section>
  );
}
