import { apiFetch } from "@/src/services/api";
import type {
  Wishlist,
  WishlistItem,
  WishlistVariantItem,
} from "@/src/types/wishlist.types";

export const WishlistService = {
  async getWishlist(params: { page?: number; limit?: number } = {}): Promise<Wishlist> {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 10));
    return apiFetch<Wishlist>(`/wishlist?${qs.toString()}`);
  },

  async addItem(variantId: number): Promise<WishlistItem> {
    return apiFetch<WishlistItem>("/wishlist/items", {
      method: "POST",
      body: JSON.stringify({ variantId }),
    });
  },

  async removeItem(variantId: number): Promise<void> {
    await apiFetch<void>(`/wishlist/items/${variantId}`, { method: "DELETE" });
  },
};

const FALLBACK_THUMB =
  "https://hanoicomputercdn.com/media/product/placeholder.jpg";

function mapItem(raw: WishlistItem): WishlistVariantItem | null {
  if (!raw.variant) return null;
  const v = raw.variant;
  const hasDiscount =
    typeof v.originalPrice === "number" && v.originalPrice > v.price;
  return {
    id: String(raw.id),
    productId: v.slug,
    productName: v.productName,
    productSlug: v.slug,
    thumbnailSrc: v.imageUrl ?? FALLBACK_THUMB,
    variantId: String(v.variantId),
    variantLabel: v.variantName,
    sku: v.sku,
    currentPrice: v.price,
    addedPrice: v.price,
    originalPrice: hasDiscount ? v.originalPrice : undefined,
    outOfStock: v.stock <= 0,
    addedAt: raw.addedAt,
    categoryName: v.categoryName ?? null,
    brands: v.brands ?? [],
  };
}

export interface PaginatedWishlist {
  items: WishlistVariantItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyWishlist(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedWishlist> {
  const wishlist = await WishlistService.getWishlist(params);
  return {
    items: wishlist.items
      .map(mapItem)
      .filter((i): i is WishlistVariantItem => i !== null),
    total: wishlist.total,
    page: wishlist.page,
    limit: wishlist.limit,
    totalPages: wishlist.totalPages,
  };
}
