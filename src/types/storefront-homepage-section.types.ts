import type { StorefrontProductCardDto } from "./storefront-product-card.types";

export type StorefrontSectionType =
  | "category"
  | "promotion"
  | "brand"
  | "manual"
  | "new_arrivals"
  | "best_selling";

export type StorefrontSectionLayout = "carousel" | "grid_3" | "grid_4" | "grid_6";

export interface StorefrontHomepageSection {
  sectionId: number;
  title: string;
  subtitle?: string;
  viewAllUrl?: string;
  type: StorefrontSectionType;
  layout: StorefrontSectionLayout;
  badgeLabel?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  sortOrder: number;
  products: StorefrontProductCardDto[];
}

export interface StorefrontFlashSaleInfo {
  id: number;
  name: string;
  startAt: string;
  endAt: string;
  bannerTitle: string | null;
  bannerImageUrl: string | null;
  bannerAlt: string | null;
}

export interface StorefrontFlashSaleResponse {
  flashSale: StorefrontFlashSaleInfo | null;
  products: StorefrontProductCardDto[];
}

export interface StorefrontPromotionInfo {
  id: number;
  name: string;
  endDate: string;
}

export interface StorefrontPromotionProducts {
  promotions: StorefrontPromotionInfo[];
  products: (StorefrontProductCardDto & { promotionId: number })[];
}
