import { PromotionCard } from "./PromotionCard";
import type { Promotion } from "@/src/types/promotion.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export interface ActivePromotionsListProps {
  promotions: Promotion[];
  /** Map from promotion.id → products eligible for that promotion. */
  productsByPromotion?: Record<number, StorefrontProductCardDto[]>;
}

/**
 * ActivePromotionsList — vertical stack of non-coupon promotions with mechanism
 * explanations and eligible products. Coupons are excluded by the page; this
 * component does not filter again.
 */
export function ActivePromotionsList({
  promotions,
  productsByPromotion,
}: ActivePromotionsListProps) {
  if (promotions.length === 0) {
    return (
      <section className="py-10 max-w-[1450px] mx-auto">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-5 text-xl font-bold text-secondary-900">
            Khuyến mãi đang diễn ra
          </h2>
          <p className="rounded-xl border border-dashed border-secondary-200 bg-secondary-50 px-4 py-12 text-center text-sm text-secondary-500">
            Hiện chưa có chương trình khuyến mãi tự động nào.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 max-w-[1450px] mx-auto">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="mb-2 text-xl font-bold text-secondary-900">
          Khuyến mãi đang diễn ra
        </h2>
        <p className="mb-5 text-sm text-secondary-500">
          Các ưu đãi sau sẽ tự động áp dụng ở bước thanh toán khi đơn hàng thỏa
          điều kiện.
        </p>
        <div className="flex flex-col gap-5">
          {promotions.map((p) => (
            <PromotionCard
              key={p.id}
              promotion={p}
              products={productsByPromotion?.[p.id] ?? []}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
