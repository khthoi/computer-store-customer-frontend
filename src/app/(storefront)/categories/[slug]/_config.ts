import type {
  StorefrontBrand,
  StorefrontFacetGroup,
} from "@/src/services/storefront-catalog-meta.service";

export {
  PRICE_MIN,
  PRICE_MAX,
  PRICE_STEP,
  SORT_OPTIONS,
} from "@/src/app/(storefront)/products/_config";

export type {
  FilterType,
  FilterOption,
  FilterDefinition,
  FilterValue,
  FilterState,
} from "@/src/app/(storefront)/products/_config";

import {
  PRICE_MIN,
  PRICE_MAX,
  PRICE_STEP,
  type FilterDefinition,
} from "@/src/app/(storefront)/products/_config";

function stripHtmlLabel(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Filter definitions for a single-category landing page.
 *
 * Differs from the main catalog filter set: the `category` filter is omitted
 * because the category is pinned by the URL slug. To switch category, the user
 * navigates via sub-category chips or the megamenu.
 */
export function buildCategoryFilterDefinitions(
  brands: StorefrontBrand[],
  facets: StorefrontFacetGroup[] = [],
): FilterDefinition[] {
  const staticDefs: FilterDefinition[] = [
    {
      key: "brand",
      label: "Thương hiệu",
      type: "checkbox",
      options: brands.map((b) => ({ value: b.slug, label: b.name })),
    },
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
      key: "inStock",
      label: "Còn hàng",
      type: "toggle",
    },
    {
      key: "onSale",
      label: "Đang sale",
      type: "toggle",
    },
    {
      key: "rating",
      label: "Đánh giá",
      type: "rating",
    },
  ];

  const facetDefs: FilterDefinition[] = facets
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .flatMap((g) =>
      g.types
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map<FilterDefinition>((t) => ({
          key: t.key,
          label: g.types.length === 1 ? t.label : `${g.label} · ${t.label}`,
          type: t.widget,
          options: t.options?.map((o) => ({
            value: o.value,
            label: stripHtmlLabel(o.label),
            count: o.count,
          })),
          min: t.min,
          max: t.max,
          step: t.step,
          unit: t.unit ?? undefined,
        })),
    );

  return [...staticDefs, ...facetDefs];
}
