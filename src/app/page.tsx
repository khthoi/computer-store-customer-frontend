/**
 * TechStore — Homepage
 *
 * The Header and Footer are rendered by layout.tsx (sticky header + site-wide footer).
 * This page composes the homepage from server-fetched data: banners, promotions,
 * flash sale, and dynamic sections configured via admin /content/homepage.
 */

import { HeroBanner } from "@/src/components/home/HeroBanner";
import { CategorySlider } from "@/src/components/home/CategorySlider";
import { TrustBadges } from "@/src/components/home/TrustBadges";
import { FlashSaleSection } from "@/src/components/home/FlashSaleSection";
import { PromotionShowcaseSection } from "@/src/components/home/PromotionShowcaseSection";
import { HomepageDynamicSection } from "@/src/components/home/HomepageDynamicSection";
import { getHomeContent } from "@/src/services/storefront-home.service";
import { getActiveFlashSale } from "@/src/services/storefront-flash-sale.service";
import { getActivePromotionProducts } from "@/src/services/storefront-promotion.service";
import { getHomepageSections } from "@/src/services/storefront-homepage-section.service";

// Storefront homepage must always reflect the latest admin config — no cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const [homeContent, flashSaleData, promotionShowcase, sections] = await Promise.all([
    getHomeContent(),
    getActiveFlashSale(),
    getActivePromotionProducts(),
    getHomepageSections(),
  ]);

  const heroBanner =
    homeContent.banners.hero[0] ?? homeContent.banners.heroSlider[0] ?? null;

  return (
    <>
      <HeroBanner
        hero={heroBanner}
        heroSlides={homeContent.banners.heroSlider}
        smallPromos={homeContent.banners.smallPromo}
      />
      <TrustBadges badges={homeContent.trustBadges} />
      <CategorySlider items={homeContent.categoryShortcuts} />

      {flashSaleData.flashSale && flashSaleData.products.length > 0 && (
        <FlashSaleSection
          flashSale={flashSaleData.flashSale}
          products={flashSaleData.products}
        />
      )}

      {promotionShowcase.products.length > 0 && (
        <PromotionShowcaseSection
          promotions={promotionShowcase.promotions}
          products={promotionShowcase.products}
        />
      )}

      {sections.map((section) => (
        <HomepageDynamicSection key={section.sectionId} section={section} />
      ))}
    </>
  );
}
