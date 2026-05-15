"use client";

import { ProductCardList } from "@/src/components/product/ProductCardList";
import {
  toProductCardProps,
  type StorefrontProductCardDto,
} from "@/src/types/storefront-product-card.types";

export interface PromotionProductsProps {
  products: StorefrontProductCardDto[];
  /** Max products to show in the inline grid. */
  maxItems?: number;
}

/**
 * PromotionProducts — compact product grid rendered inside a PromotionCard.
 * Shows up to `maxItems` products as cards plus a small caption indicating
 * how many products are eligible in total.
 */
export function PromotionProducts({
  products,
  maxItems = 12,
}: PromotionProductsProps) {
  if (products.length === 0) {
    return (
      <div>
        <p className="mb-3 text-sm font-semibold text-secondary-900">
          Sản phẩm áp dụng
        </p>
        <div className="rounded-lg border border-dashed border-secondary-200 bg-white px-4 py-8 text-center text-xs text-secondary-500">
          Khuyến mãi áp dụng dựa trên điều kiện ở giỏ hàng. Sản phẩm cụ thể sẽ
          được tính ở bước thanh toán.
        </div>
      </div>
    );
  }

  const visible = products.slice(0, maxItems);
  const remaining = products.length - visible.length;
  const cards = visible.map((dto) => toProductCardProps(dto));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-secondary-900">Sản phẩm áp dụng</p>
        {remaining > 0 ? (
          <span className="text-xs text-secondary-500">
            +{remaining.toLocaleString("vi-VN")} sản phẩm khác
          </span>
        ) : null}
      </div>
      <ProductCardList products={cards} itemsPerRow={6} gap="sm" />
    </div>
  );
}
