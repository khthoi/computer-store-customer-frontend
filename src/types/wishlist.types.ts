export interface WishlistVariant {
  variantId: number;
  variantName: string;
  price: number;
  status: string;
  productName: string;
  slug: string;
  stock: number;
  imageUrl: string | null;
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
}
