import { HomepageProductCarousel } from "./HomepageProductCarousel";
import { FlashSaleCountdown } from "./FlashSaleCountdown";
import type {
  StorefrontFlashSaleInfo,
} from "@/src/types/storefront-homepage-section.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

interface FlashSaleSectionProps {
  flashSale: StorefrontFlashSaleInfo;
  products: StorefrontProductCardDto[];
}

export function FlashSaleSection({ flashSale, products }: FlashSaleSectionProps) {
  const title = flashSale.bannerTitle?.trim() || flashSale.name || "Flash Sale";
  return (
    <HomepageProductCarousel
      title={title}
      href="/promotions"
      products={products}
      badgeNode={<FlashSaleCountdown endAt={flashSale.endAt} />}
    />
  );
}
