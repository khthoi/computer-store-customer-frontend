import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type {
  StorefrontBanner,
  StorefrontCategoryShortcut,
  StorefrontHomeContent,
  StorefrontTrustBadge,
} from "@/src/types/storefront-home.types";

const EMPTY_HOME_CONTENT: StorefrontHomeContent = {
  banners: {
    hero: [],
    heroSlider: [],
    smallPromo: [],
  },
  trustBadges: [],
  categoryShortcuts: [],
};

export async function getHomeBanners(): Promise<StorefrontHomeContent["banners"]> {
  try {
    const items = await storefrontApiFetch<StorefrontBanner[]>(
      "/banners?position=homepage_hero&position=homepage_hero_slider&position=homepage_small",
      {
        cache: "no-store",
      },
    );

    return {
      hero: items.filter((item) => item.position === "homepage_hero"),
      heroSlider: items.filter((item) => item.position === "homepage_hero_slider"),
      smallPromo: items.filter((item) => item.position === "homepage_small"),
    };
  } catch {
    return EMPTY_HOME_CONTENT.banners;
  }
}

export async function getHomeTrustBadges(): Promise<StorefrontTrustBadge[]> {
  try {
    return await storefrontApiFetch<StorefrontTrustBadge[]>("/content/trust-badges", {
      cache: "no-store",
    });
  } catch {
    return [];
  }
}

export async function getHomeCategoryShortcuts(): Promise<StorefrontCategoryShortcut[]> {
  try {
    return await storefrontApiFetch<StorefrontCategoryShortcut[]>("/content/category-shortcuts", {
      cache: "no-store",
    });
  } catch {
    return [];
  }
}

export async function getHomeContent(): Promise<StorefrontHomeContent> {
  try {
    const response = await storefrontApiFetch<StorefrontHomeContent>("/content/homepage", {
      cache: "no-store",
    });

    return {
      banners: response.banners ?? EMPTY_HOME_CONTENT.banners,
      trustBadges: response.trustBadges ?? [],
      categoryShortcuts: response.categoryShortcuts ?? [],
    };
  } catch {
    const [banners, trustBadges, categoryShortcuts] = await Promise.all([
      getHomeBanners().catch(() => EMPTY_HOME_CONTENT.banners),
      getHomeTrustBadges().catch(() => []),
      getHomeCategoryShortcuts().catch(() => []),
    ]);

    return {
      banners,
      trustBadges,
      categoryShortcuts,
    };
  }
}
