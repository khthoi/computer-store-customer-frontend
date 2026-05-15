export type BannerPosition =
  | "homepage_hero"
  | "homepage_hero_slider"
  | "homepage_small"
  | "side_banner"
  | "promotions_banner";

export type BannerStatus = "draft" | "active";

export interface PublicBanner {
  id: string;
  title: string;
  position: BannerPosition;
  status: BannerStatus;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  linkTarget: "_self" | "_blank" | null;
  altText: string | null;
  overlayText: string | null;
  overlaySubtext: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  badge: string | null;
  badgeColor: string | null;
  badgeTextColor: string | null;
  gridX: number | null;
  gridY: number | null;
  gridW: number | null;
  gridH: number | null;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
}
