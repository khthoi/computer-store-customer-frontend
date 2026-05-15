import type {
  StorefrontBrand,
  StorefrontCategoryNode,
  StorefrontFacetGroup,
} from "@/src/services/storefront-catalog-meta.service";
import { flattenCategoryTree } from "@/src/services/storefront-catalog-meta.service";

function stripHtmlLabel(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export type FilterType =
  | "dropdown"
  | "checkbox"
  | "range"
  | "toggle"
  | "rating"
  | "select";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export type FilterValue =
  | string
  | string[]
  | [number, number]
  | boolean
  | number;

export type FilterState = Record<string, FilterValue>;

export const SORT_OPTIONS = [
  { value: "bestselling", label: "Bán chạy" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
];

export const PRICE_MIN = 0;
export const PRICE_MAX = 100_000_000;
export const PRICE_STEP = 500_000;

export function buildCatalogFilterDefinitions(
  brands: StorefrontBrand[],
  categoryTree: StorefrontCategoryNode[],
  facets: StorefrontFacetGroup[] = [],
): FilterDefinition[] {
  const leafCategories = flattenCategoryTree(categoryTree).filter(
    (c) => !c.children || c.children.length === 0,
  );

  const staticDefs: FilterDefinition[] = [
    {
      key: "category",
      label: "Danh mục",
      type: "dropdown",
      options: leafCategories.map((c) => ({
        value: c.slug,
        label: c.name,
        count: c.productCount,
      })),
    },
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
    .flatMap((group) =>
      group.types
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map<FilterDefinition>((type) => ({
          key: type.key,
          label: group.types.length === 1 ? type.label : `${group.label} · ${type.label}`,
          type: type.widget,
          options: type.options?.map((option) => ({
            value: option.value,
            label: stripHtmlLabel(option.label),
            count: option.count,
          })),
          min: type.min,
          max: type.max,
          step: type.step,
          unit: type.unit ?? undefined,
        })),
    );

  return [...staticDefs, ...facetDefs];
}
