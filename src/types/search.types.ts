export interface QuickSuggestionVariant {
  variantId: number;
  name: string;
  price: number;
  sku: string;
  status: string;
  mediaUrl: string | null;
}

export interface QuickSuggestionVariantStandalone extends QuickSuggestionVariant {
  productId: number;
  productName: string;
  productSlug: string;
}

export interface QuickSuggestionProduct {
  id: number;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  brandName: string;
  categoryName: string;
  variantCount: number;
  topVariants: QuickSuggestionVariant[];
}

export interface QuickSuggestionBrand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface QuickSuggestionCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string | null;
}

export interface QuickSuggestionResponse {
  query: string;
  products: QuickSuggestionProduct[];
  variants: QuickSuggestionVariantStandalone[];
  brands: QuickSuggestionBrand[];
  categories: QuickSuggestionCategory[];
  totalProductMatches: number;
  totalVariantMatches: number;
  totalBrandMatches: number;
  totalCategoryMatches: number;
}
