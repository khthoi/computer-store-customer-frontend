import type { FilterDefinition } from "@/src/app/(storefront)/products/_config";
import type { StorefrontBrand } from "@/src/services/storefront-catalog-meta.service";
import { PRICE_MAX, PRICE_MIN, PRICE_STEP } from "@/src/app/(storefront)/products/_config";

export function buildSearchFilterDefinitions(
  brands: StorefrontBrand[],
): FilterDefinition[] {
  return [
    {
      key: "price",
      label: "Khoảng giá",
      type: "range",
      min: PRICE_MIN,
      max: PRICE_MAX,
      step: PRICE_STEP,
      unit: "₫",
    },
    {
      key: "brand",
      label: "Thương hiệu",
      type: "checkbox",
      options: brands.map((b) => ({ value: b.slug, label: b.name })),
    },
    {
      key: "rating",
      label: "Đánh giá",
      type: "rating",
    },
    {
      key: "inStock",
      label: "Còn hàng",
      type: "toggle",
    },
  ];
}
