import type { StorefrontBanner } from "@/src/types/storefront-home.types";

export type StorefrontMenuPosition =
  | "header_top"
  | "header_main"
  | "footer_column_1"
  | "footer_column_2"
  | "footer_column_3"
  | "mobile_main"
  | "sidebar";

export interface StorefrontMenuItem {
  id: string;
  label: string;
  url: string;
  target: "_self" | "_blank";
  type: string;
  children: StorefrontMenuItem[];
}

export interface StorefrontMenu {
  id: string;
  location: StorefrontMenuPosition;
  name: string;
  items: StorefrontMenuItem[];
}

export interface StorefrontCategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string;
  displayOrder: number;
  active: boolean;
  productCount: number;
  nodeType: "category" | "filter" | "label";
  filterParams: Record<string, string> | null;
  badgeText: string | null;
  badgeBg: string | null;
  badgeFg: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  children?: StorefrontCategoryNode[];
}

export interface FooterLinkColumnConfig {
  title: string;
  location: "footer_column_1" | "footer_column_2" | "footer_column_3";
}

export interface FooterConfigData {
  brand: {
    logoUrl: string;
    logoAlt: string;
    storeName: string;
    description: string;
  };
  contact: {
    address?: string;
    phone?: string;
    email?: string;
    supportHours?: string;
  };
  linkColumns: FooterLinkColumnConfig[];
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  copyright: string;
  bottomLinks: Array<{
    label: string;
    url: string;
  }>;
}

export interface SearchShortcutItem {
  id: string;
  label: string;
  url: string;
}

export interface StorefrontPublicSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialFacebook: string;
  socialYoutube: string;
  socialTiktok: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialZalo: string;
}

export interface SearchSuggestionItem {
  id: string;
  name: string;
  href: string;
}

export interface StorefrontLayoutData {
  publicSettings: StorefrontPublicSettings;
  headerTopMenu: StorefrontMenuItem[];
  headerMainMenu: StorefrontMenuItem[];
  mobileMainMenu: StorefrontMenuItem[];
  sideBanners: StorefrontBanner[];
  footerMenus: Record<"footer_column_1" | "footer_column_2" | "footer_column_3", StorefrontMenuItem[]>;
  footerConfig: FooterConfigData;
  categoryTree: StorefrontCategoryNode[];
  searchShortcuts: SearchShortcutItem[];
}
