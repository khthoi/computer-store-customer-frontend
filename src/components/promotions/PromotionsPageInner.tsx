import { BoltIcon } from "@heroicons/react/24/solid";
import { FlashSaleBanner } from "./FlashSaleBanner";
import { ActivePromotionsList } from "./ActivePromotionsList";
import type { StorefrontFlashSaleResponse } from "@/src/types/storefront-homepage-section.types";
import type { Promotion } from "@/src/types/promotion.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export interface PromotionsPageInnerProps {
  flashSale: StorefrontFlashSaleResponse;
  promotions: Promotion[];
  productsByPromotion: Record<number, StorefrontProductCardDto[]>;
}

function FlashSaleEmpty() {
  return (
    <section className="py-10 max-w-[1450px] mx-auto">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center gap-2">
          <BoltIcon className="h-6 w-6 text-orange-500" aria-hidden="true" />
          <h2 className="text-xl font-bold text-secondary-900">Flash Sale</h2>
        </div>
        <p className="rounded-xl border border-dashed border-secondary-200 bg-secondary-50 px-4 py-12 text-center text-sm text-secondary-500">
          Hiện chưa có chương trình Flash Sale nào đang diễn ra. Hãy quay lại
          sớm để săn ưu đãi nhé!
        </p>
      </div>
    </section>
  );
}

/**
 * PromotionsPageInner — content for the /promotions tab.
 *
 * Banner + sub-navigation are rendered by the shared layout
 * (app/(storefront)/promotions/layout.tsx) and persist across tab switches.
 */
export function PromotionsPageInner({
  flashSale,
  promotions,
  productsByPromotion,
}: PromotionsPageInnerProps) {
  const hasFlashSale =
    flashSale.flashSale != null && flashSale.products.length > 0;

  return (
    <>
      {hasFlashSale ? (
        <FlashSaleBanner
          flashSale={flashSale.flashSale!}
          products={flashSale.products}
        />
      ) : (
        <FlashSaleEmpty />
      )}

      <ActivePromotionsList
        promotions={promotions}
        productsByPromotion={productsByPromotion}
      />
    </>
  );
}
