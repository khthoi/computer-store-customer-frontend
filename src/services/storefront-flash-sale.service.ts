import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type { StorefrontFlashSaleResponse } from "@/src/types/storefront-homepage-section.types";

const EMPTY: StorefrontFlashSaleResponse = { flashSale: null, products: [] };

export async function getActiveFlashSale(): Promise<StorefrontFlashSaleResponse> {
  try {
    return await storefrontApiFetch<StorefrontFlashSaleResponse>(
      "/storefront/flash-sale/active",
      { cache: "no-store" },
    );
  } catch {
    return EMPTY;
  }
}
