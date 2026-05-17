import {
  getActivePromotions,
  getActivePromotionProducts,
} from "@/src/services/storefront-promotion.service";
import { VoucherList } from "@/src/components/promotions/vouchers/VoucherList";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mã giảm giá · PC Store",
  description:
    "Danh sách mã giảm giá đang phát hành — sao chép và dùng ở bước thanh toán.",
};

export default async function VouchersPage() {
  const [promotions, promotionProducts] = await Promise.all([
    getActivePromotions(),
    getActivePromotionProducts(48),
  ]);

  const vouchers = promotions.filter((p) => p.isCoupon && p.code);

  const productsByPromotion: Record<number, StorefrontProductCardDto[]> = {};
  for (const item of promotionProducts.products) {
    const list = productsByPromotion[item.promotionId] ?? [];
    list.push(item);
    productsByPromotion[item.promotionId] = list;
  }

  return (
    <main className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900">Mã giảm giá</h1>
        <p className="mt-1 text-sm text-secondary-500">
          Sao chép mã bên dưới và dán vào ô &quot;Mã giảm giá&quot; ở bước thanh
          toán để được áp dụng.
        </p>
      </header>
      <VoucherList
        vouchers={vouchers}
        productsByPromotion={productsByPromotion}
      />
    </main>
  );
}
