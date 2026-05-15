import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";
import type {
  QuickSuggestionBrand,
  QuickSuggestionCategory,
} from "@/src/types/search.types";

export type StorefrontSearchSort =
  | "bestselling"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "rating";

export interface StorefrontSearchParams {
  q: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  ratingMin?: number;
  sort?: StorefrontSearchSort;
  page: number;
  limit: number;
}

export interface StorefrontSearchResults {
  query: string;
  products: StorefrontProductCardDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  relatedCategories: QuickSuggestionCategory[];
  relatedBrands: QuickSuggestionBrand[];
}
