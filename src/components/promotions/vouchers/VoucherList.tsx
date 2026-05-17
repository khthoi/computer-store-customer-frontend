import { PromotionCard } from "../cards/PromotionCard";
import type { Promotion } from "@/src/types/promotion.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export interface VoucherListProps {
  vouchers: Promotion[];
  /** Map from promotion.id → products eligible for that voucher. */
  productsByPromotion?: Record<number, StorefrontProductCardDto[]>;
}

/**
 * VoucherList — vertical stack of coupon promotions. Each card shows the
 * coupon code, copy button, mechanism explanation, and eligible products.
 * Pages should pre-filter (`p.isCoupon && p.code`).
 */
export function VoucherList({ vouchers, productsByPromotion }: VoucherListProps) {
  if (vouchers.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-secondary-200 bg-secondary-50 px-4 py-12 text-center text-sm text-secondary-500">
        Hiện chưa có mã giảm giá nào đang phát hành.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {vouchers.map((v) => (
        <PromotionCard
          key={v.id}
          promotion={v}
          showCouponCode
          products={productsByPromotion?.[v.id] ?? []}
        />
      ))}
    </div>
  );
}
