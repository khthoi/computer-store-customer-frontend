"use client";

import { usePathname } from "next/navigation";
import { SideBanners } from "./SideBanners";
import type { StorefrontBanner } from "@/src/types/storefront-home.types";

// Routes that should render without side banners.
// Auth pages: focused flow — banners are distracting.
// Legal/informational pages: narrow centred reading layout — banners waste space.
const SUPPRESSED_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/contact",
  "/chinh-sach-doi-tra",
  "/faq",
  "/support/technical",
  // CMS-driven static pages (/info/<slug>): narrow centred reading layout.
  "/info/",
  // Search results page: full-width filter + product grid layout leaves no
  // room for fixed side banners without overlapping content at mid viewports.
  "/search",
];

/**
 * SideBannersConditional — renders SideBanners on all pages except those in
 * SUPPRESSED_PREFIXES (auth flows and legal reading pages).
 */
export function SideBannersConditional({ banners }: { banners: StorefrontBanner[] }) {
  const pathname = usePathname();
  const isSuppressed = SUPPRESSED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isSuppressed) return null;
  return <SideBanners banners={banners} />;
}
