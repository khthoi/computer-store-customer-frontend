export interface StorefrontBanner {
  id: string;
  title: string;
  position: string;
  status: string;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  sidePlacement: "left" | "right" | null;
  linkUrl: string | null;
  linkTarget: string;
  altText: string | null;
  caption: string | null;
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
}

export interface StorefrontTrustBadge {
  id: string;
  icon:
    | "TruckIcon"
    | "ShieldCheckIcon"
    | "ArrowPathIcon"
    | "PhoneIcon"
    | "CreditCardIcon"
    | "GiftIcon"
    | "StarIcon"
    | "CheckBadgeIcon"
    | "ClockIcon"
    | "MapPinIcon"
    | "TagIcon"
    | "LockClosedIcon";
  title: string;
  subtitle: string | null;
  sortOrder: number;
}

export interface StorefrontCategoryShortcut {
  id: string;
  emoji: string | null;
  iconUrl: string | null;
  label: string;
  url: string;
  sortOrder: number;
}

export interface StorefrontHomeContent {
  banners: {
    hero: StorefrontBanner[];
    heroSlider: StorefrontBanner[];
    smallPromo: StorefrontBanner[];
  };
  trustBadges: StorefrontTrustBadge[];
  categoryShortcuts: StorefrontCategoryShortcut[];
}
