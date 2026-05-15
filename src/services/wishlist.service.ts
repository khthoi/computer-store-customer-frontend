import { apiFetch } from "@/src/services/api";
import type { Wishlist, WishlistItem } from "@/src/types/wishlist.types";

export const WishlistService = {
  async getWishlist(): Promise<Wishlist> {
    return apiFetch<Wishlist>("/wishlist");
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
