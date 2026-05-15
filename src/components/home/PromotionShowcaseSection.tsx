import { HomepageProductCarousel } from "./HomepageProductCarousel";
import type {
  StorefrontPromotionInfo,
} from "@/src/types/storefront-homepage-section.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

interface PromotionShowcaseSectionProps {
  promotions: StorefrontPromotionInfo[];
  products: (StorefrontProductCardDto & { promotionId: number })[];
}

export function PromotionShowcaseSection({
  promotions,
  products,
}: PromotionShowcaseSectionProps) {
  const headline =
    promotions.length === 1
      ? promotions[0].name
      : `Đang có ${promotions.length} chương trình khuyến mãi`;

  return (
    <HomepageProductCarousel
      title={`${headline}`}
      href="/khuyen-mai"
      products={products}
    />
  );
}
