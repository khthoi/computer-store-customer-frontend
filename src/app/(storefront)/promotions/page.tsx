import { PromotionsPageInner } from "@/src/components/promotions/page/PromotionsPageInner";
import { getActiveFlashSale } from "@/src/services/storefront-flash-sale.service";
import {
  getActivePromotions,
  getActivePromotionProducts,
} from "@/src/services/storefront-promotion.service";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Khuyến mãi · PC Store",
  description:
    "Tổng hợp khuyến mãi, mã giảm giá và phần thưởng đang diễn ra tại PC Store.",
};

export default async function PromotionsPage() {
  const [flashSale, promotions, promotionProducts] = await Promise.all([
    getActiveFlashSale(),
    getActivePromotions(),
    getActivePromotionProducts(48),
  ]);

  const autoPromotions = promotions.filter((p) => !p.isCoupon);

  const productsByPromotion: Record<number, StorefrontProductCardDto[]> = {};
  for (const item of promotionProducts.products) {
    const list = productsByPromotion[item.promotionId] ?? [];
    list.push(item);
    productsByPromotion[item.promotionId] = list;
  }

  return (
    <PromotionsPageInner
      flashSale={flashSale}
      promotions={autoPromotions}
      productsByPromotion={productsByPromotion}
    />
  );
}
