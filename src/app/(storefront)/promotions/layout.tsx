import type { ReactNode } from "react";
import { PromotionHeroBanner } from "@/src/components/promotions/page/PromotionHeroBanner";
import { PromotionsSubNav } from "@/src/components/promotions/page/PromotionsSubNav";
import { getBannersByPosition } from "@/src/services/storefront-banner.service";

export const dynamic = "force-dynamic";

/**
 * Shared layout for /promotions, /promotions/vouchers and /promotions/rewards.
 *
 * Hero banners + sub-navigation render here so they persist across tab
 * switches (Next.js App Router keeps the layout mounted; only `children`
 * swaps when the user changes tab).
 */
export default async function PromotionsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const banners = await getBannersByPosition("promotions_banner");

  return (
    <>
      <PromotionHeroBanner banners={banners} />

      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <PromotionsSubNav />
      </div>

      {children}
    </>
  );
}
