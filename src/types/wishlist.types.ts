export interface WishlistVariant {
  variantId: number;
  variantName: string;
  sku: string;
  price: number;
  originalPrice: number;
  status: string;
  productName: string;
  slug: string;
  stock: number;
  imageUrl: string | null;
  categoryName: string | null;
  brands: string[];
}

export interface WishlistItem {
  id: number;
  variantId: number;
  addedAt: string;
  variant: WishlistVariant | null;
}

export interface Wishlist {
  id: number;
  items: WishlistItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * UI-facing shape consumed by the /account/wishlist page.
 * Built by the service layer from the raw `Wishlist` response.
 */
export interface WishlistVariantItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  thumbnailSrc: string;
  variantId: string;
  variantLabel: string;
  sku: string;
  currentPrice: number;
  addedPrice: number;
  originalPrice?: number;
  outOfStock: boolean;
  addedAt: string;
  categoryName: string | null;
  brands: string[];
}
