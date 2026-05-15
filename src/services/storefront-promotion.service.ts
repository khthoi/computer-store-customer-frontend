import { apiFetch } from "@/src/services/api";
import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type { StorefrontPromotionProducts } from "@/src/types/storefront-homepage-section.types";
import type { Promotion } from "@/src/types/promotion.types";

const EMPTY: StorefrontPromotionProducts = { promotions: [], products: [] };

export async function getActivePromotionProducts(
  maxProducts = 12,
): Promise<StorefrontPromotionProducts> {
  try {
    return await storefrontApiFetch<StorefrontPromotionProducts>(
      `/storefront/promotion-products?maxProducts=${maxProducts}`,
      { cache: "no-store" },
    );
  } catch {
    return EMPTY;
  }
}

export async function getActivePromotions(): Promise<Promotion[]> {
  try {
    return await apiFetch<Promotion[]>("/promotions/active");
  } catch {
    return [];
  }
}
