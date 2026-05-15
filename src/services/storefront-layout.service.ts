import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import {
  getActiveAnnouncementBars,
  getActivePopups,
} from "@/src/services/storefront-announcement.service";
import type {
  FooterConfigData,
  SearchShortcutItem,
  StorefrontBanner,
  StorefrontCategoryNode,
  StorefrontLayoutData,
  StorefrontMenu,
  StorefrontMenuItem,
  StorefrontMenuPosition,
  StorefrontPublicSettings,
} from "@/src/types/storefront-layout.types";
import type {
  QuickSuggestionResponse,
  QuickSuggestionVariant,
} from "@/src/types/search.types";

interface RawMenuItem {
  id?: string | number;
  label?: string;
  url?: string | null;
  target?: string;
  type?: string;
  children?: RawMenuItem[];
}

interface RawMenu {
  id?: string | number;
  name?: string;
  items?: RawMenuItem[];
}

const FOOTER_POSITIONS = [
  "footer_column_1",
  "footer_column_2",
  "footer_column_3",
] as const;

const EMPTY_FOOTER_CONFIG: FooterConfigData = {
  brand: {
    logoUrl: "",
    description: "",
  },
  contact: {},
  linkColumns: [
    { title: "Hỗ trợ khách hàng", location: "footer_column_1" },
    { title: "Danh mục sản phẩm", location: "footer_column_2" },
    { title: "Về PC Store", location: "footer_column_3" },
  ],
  socialLinks: [],
  copyright: `© ${new Date().getFullYear()} PC Store`,
  bottomLinks: [],
};

const EMPTY_PUBLIC_SETTINGS: StorefrontPublicSettings = {
  siteName: "PC Store",
  logoUrl: "",
  faviconUrl: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialFacebook: "",
  socialYoutube: "",
  socialTiktok: "",
  socialInstagram: "",
  socialLinkedin: "",
  socialTwitter: "",
  socialZalo: "",
};

function ensureMenuItemUrl(item: { url?: string | null }): string {
  return item.url && item.url.trim().length > 0 ? item.url : "#";
}

function normalizeMenuItem(raw: RawMenuItem): StorefrontMenuItem {
  return {
    id: String(raw.id),
    label: String(raw.label ?? ""),
    url: ensureMenuItemUrl(raw),
    target: raw.target === "_blank" ? "_blank" : "_self",
    type: String(raw.type ?? "link"),
    children: Array.isArray(raw.children) ? raw.children.map(normalizeMenuItem) : [],
  };
}

function normalizeMenu(raw: RawMenu, location: StorefrontMenuPosition): StorefrontMenu {
  return {
    id: String(raw.id ?? location),
    location,
    name: String(raw.name ?? location),
    items: Array.isArray(raw.items) ? raw.items.map(normalizeMenuItem) : [],
  };
}

function fallbackFooterConfig(siteConfig: Record<string, string>): FooterConfigData {
  return {
    ...EMPTY_FOOTER_CONFIG,
    brand: {
      logoUrl: "",
      description: siteConfig.store_description ?? "",
    },
    contact: {
      address: siteConfig.store_address,
      phone: siteConfig.store_phone,
      email: siteConfig.store_email,
      supportHours: siteConfig.store_support_hours,
    },
  };
}

function parseFooterConfig(siteConfig: Record<string, string>): FooterConfigData {
  const raw = siteConfig.footer_config;
  if (!raw) {
    return fallbackFooterConfig(siteConfig);
  }

  try {
    const parsed = JSON.parse(raw) as FooterConfigData;
    return {
      ...fallbackFooterConfig(siteConfig),
      ...parsed,
      brand: {
        ...fallbackFooterConfig(siteConfig).brand,
        ...(parsed.brand ?? {}),
      },
      contact: {
        ...fallbackFooterConfig(siteConfig).contact,
        ...(parsed.contact ?? {}),
      },
      linkColumns: parsed.linkColumns?.length ? parsed.linkColumns : EMPTY_FOOTER_CONFIG.linkColumns,
      socialLinks: parsed.socialLinks ?? [],
      bottomLinks: parsed.bottomLinks ?? [],
    };
  } catch {
    return fallbackFooterConfig(siteConfig);
  }
}

function parsePublicSettings(
  settings: Record<string, string>,
  footerConfig: FooterConfigData,
): StorefrontPublicSettings {
  const socialMap = new Map(
    (footerConfig.socialLinks ?? []).map((item) => [item.platform, item.url]),
  );

  return {
    siteName: settings.site_name || EMPTY_PUBLIC_SETTINGS.siteName,
    logoUrl: settings.logo_url || footerConfig.brand.logoUrl || "",
    faviconUrl: settings.favicon_url || "",
    contactEmail: settings.contact_email || footerConfig.contact.email || "",
    contactPhone: settings.contact_phone || footerConfig.contact.phone || "",
    address: settings.address || footerConfig.contact.address || "",
    socialFacebook: settings.social_facebook || socialMap.get("facebook") || "",
    socialYoutube: settings.social_youtube || socialMap.get("youtube") || "",
    socialTiktok: settings.social_tiktok || socialMap.get("tiktok") || "",
    socialInstagram: settings.social_instagram || socialMap.get("instagram") || "",
    socialLinkedin: settings.social_linkedin || socialMap.get("linkedin") || "",
    socialTwitter: settings.social_twitter || socialMap.get("twitter") || "",
    socialZalo: settings.social_zalo || socialMap.get("zalo") || "",
  };
}

function flattenCategoryShortcuts(tree: StorefrontCategoryNode[]): SearchShortcutItem[] {
  const items: SearchShortcutItem[] = [];

  function visit(nodes: StorefrontCategoryNode[]) {
    for (const node of nodes) {
      if (items.length >= 12) return;
      if (node.nodeType !== "label") {
        items.push({
          id: node.id,
          label: node.name,
          url: buildCategoryHref(node),
        });
      }
      if (node.children?.length) {
        visit(node.children);
      }
    }
  }

  visit(tree);
  return items;
}

function parseCategoryShortcuts(
  siteConfig: Record<string, string>,
  tree: StorefrontCategoryNode[],
): SearchShortcutItem[] {
  const raw = siteConfig.category_shortcuts;
  if (!raw) {
    return flattenCategoryShortcuts(tree);
  }

  try {
    const parsed = JSON.parse(raw) as Array<{ id?: string; label: string; url: string; active?: boolean }>;
    const activeItems = parsed.filter((item) => item.active !== false);
    if (activeItems.length > 0) {
      return activeItems.map((item, index) => ({
        id: item.id ?? `shortcut-${index + 1}`,
        label: item.label,
        url: item.url,
      }));
    }
  } catch {
    return flattenCategoryShortcuts(tree);
  }

  return flattenCategoryShortcuts(tree);
}

export function buildCategoryHref(node: StorefrontCategoryNode): string {
  if (node.nodeType === "label") {
    return "#";
  }

  if (node.nodeType === "filter" && node.filterParams) {
    const params = new URLSearchParams(node.filterParams);
    const parentSlug = typeof node.filterParams.category === "string"
      ? node.filterParams.category
      : node.slug;
    params.delete("category");
    const qs = params.toString();
    return qs.length > 0
      ? `/categories/${encodeURIComponent(parentSlug)}?${qs}`
      : `/categories/${encodeURIComponent(parentSlug)}`;
  }

  return `/categories/${encodeURIComponent(node.slug)}`;
}

export async function getPublicMenu(position: StorefrontMenuPosition): Promise<StorefrontMenu> {
  const raw = await storefrontApiFetch<RawMenu>(`/menus/${position}`, {
    // Temporary: disable Next.js fetch cache during active development.
    // Re-enable later with:
    // next: { revalidate: 300 },
    cache: "no-store",
  });
  return normalizeMenu(raw, position);
}

export async function getPublicCategoryTree(): Promise<StorefrontCategoryNode[]> {
  return storefrontApiFetch<StorefrontCategoryNode[]>("/categories", {
    // Temporary: disable Next.js fetch cache during active development.
    // Re-enable later with:
    // next: { revalidate: 300 },
    cache: "no-store",
  });
}

export async function getPublicSiteConfig(): Promise<Record<string, string>> {
  return storefrontApiFetch<Record<string, string>>("/site-config", {
    // Temporary: disable Next.js fetch cache during active development.
    // Re-enable later with:
    // next: { revalidate: 300 },
    cache: "no-store",
  });
}

export async function getPublicSettings(): Promise<Record<string, string>> {
  return storefrontApiFetch<Record<string, string>>("/settings/public", {
    // Temporary: disable Next.js fetch cache during active development.
    // Re-enable later with:
    // next: { revalidate: 300 },
    cache: "no-store",
  });
}

export async function getPublicSideBanners(): Promise<StorefrontBanner[]> {
  return storefrontApiFetch<StorefrontBanner[]>("/banners?position=side_banner", {
    cache: "no-store",
  });
}

export async function getStorefrontLayoutData(): Promise<StorefrontLayoutData> {
  const positions: StorefrontMenuPosition[] = [
    "header_top",
    "header_main",
    "mobile_main",
    ...FOOTER_POSITIONS,
  ];

  try {
    const [
      siteConfig,
      publicSettingsRaw,
      categoryTree,
      sideBanners,
      activePopups,
      activeAnnouncementBars,
      ...menus
    ] = await Promise.all([
      getPublicSiteConfig().catch(() => ({})),
      getPublicSettings().catch(() => ({})),
      getPublicCategoryTree().catch(() => []),
      getPublicSideBanners().catch(() => []),
      getActivePopups().catch(() => []),
      getActiveAnnouncementBars().catch(() => []),
      ...positions.map((position) =>
        getPublicMenu(position).catch(() => normalizeMenu({}, position)),
      ),
    ]);

    const menuMap = new Map(menus.map((menu) => [menu.location, menu.items]));

    const footerConfig = parseFooterConfig(siteConfig);

    return {
      publicSettings: parsePublicSettings(publicSettingsRaw, footerConfig),
      headerTopMenu: menuMap.get("header_top") ?? [],
      headerMainMenu: menuMap.get("header_main") ?? [],
      mobileMainMenu: menuMap.get("mobile_main") ?? [],
      sideBanners,
      footerMenus: {
        footer_column_1: menuMap.get("footer_column_1") ?? [],
        footer_column_2: menuMap.get("footer_column_2") ?? [],
        footer_column_3: menuMap.get("footer_column_3") ?? [],
      },
      footerConfig,
      categoryTree,
      searchShortcuts: parseCategoryShortcuts(siteConfig, categoryTree),
      activePopups,
      activeAnnouncementBars,
    };
  } catch {
    return {
      publicSettings: EMPTY_PUBLIC_SETTINGS,
      headerTopMenu: [],
      headerMainMenu: [],
      mobileMainMenu: [],
      sideBanners: [],
      footerMenus: {
        footer_column_1: [],
        footer_column_2: [],
        footer_column_3: [],
      },
      footerConfig: EMPTY_FOOTER_CONFIG,
      categoryTree: [],
      searchShortcuts: [],
      activePopups: [],
      activeAnnouncementBars: [],
    };
  }
}

const EMPTY_SUGGESTIONS: QuickSuggestionResponse = {
  query: "",
  products: [],
  variants: [],
  brands: [],
  categories: [],
  totalProductMatches: 0,
  totalVariantMatches: 0,
  totalBrandMatches: 0,
  totalCategoryMatches: 0,
};

export async function getSearchSuggestions(query: string): Promise<QuickSuggestionResponse> {
  const q = query.trim();
  if (q.length < 2) {
    return { ...EMPTY_SUGGESTIONS, query: q };
  }

  const params = new URLSearchParams({ q });
  return storefrontApiFetch<QuickSuggestionResponse>(
    `/search/suggestions?${params.toString()}`,
  );
}

export async function getProductVariantSuggestions(
  productId: number,
  limit?: number,
): Promise<QuickSuggestionVariant[]> {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  const suffix = params.toString();
  const path = `/search/products/${productId}/variants${suffix ? `?${suffix}` : ""}`;
  return storefrontApiFetch<QuickSuggestionVariant[]>(path);
}
