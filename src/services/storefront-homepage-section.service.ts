import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type { StorefrontHomepageSection } from "@/src/types/storefront-homepage-section.types";

export async function getHomepageSections(): Promise<StorefrontHomepageSection[]> {
  try {
    return await storefrontApiFetch<StorefrontHomepageSection[]>(
      "/storefront/homepage-sections",
      { cache: "no-store" },
    );
  } catch {
    return [];
  }
}
