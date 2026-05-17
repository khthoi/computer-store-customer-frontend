"use client";

import Image from "next/image";
import { BoltIcon } from "@heroicons/react/24/solid";
import { ProductCardList } from "@/src/components/product/card/ProductCardList";
import { FlashSaleCountdown } from "./FlashSaleCountdown";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";
import type { StorefrontFlashSaleInfo } from "@/src/types/storefront-homepage-section.types";

export interface FlashSaleBannerProps {
  flashSale: StorefrontFlashSaleInfo;
  products: StorefrontProductCardDto[];
}

/**
 * FlashSaleBanner — flash sale section on /promotions.
 *
 * Top block:
 *   - When `bannerImageUrl` is set: hero image (16:5 on desktop) with a dark
 *     overlay carrying title + countdown + bolt icon.
 *   - Otherwise: compact text header (bolt icon + title + countdown).
 *
 * Bottom block: applied products grid (6 items per row at 2xl).
 *
 * Renders nothing when `products` is empty (caller controls empty-state UI).
 */
export function FlashSaleBanner({ flashSale, products }: FlashSaleBannerProps) {
  if (products.length === 0) return null;

  const displayTitle = flashSale.bannerTitle?.trim() || flashSale.name;
  const altText =
    flashSale.bannerAlt?.trim() ||
    flashSale.bannerTitle?.trim() ||
    `Banner ${flashSale.name}`;
  const hasBannerImage = Boolean(flashSale.bannerImageUrl);

  return (
    <section className="py-10 max-w-[1450px] mx-auto">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
          {/* ── Top block ─────────────────────────────────────────────────── */}
          {hasBannerImage ? (
            <div className="relative aspect-[16/6] w-full overflow-hidden bg-secondary-200 sm:aspect-[16/5] lg:aspect-[21/6]">
              <Image
                src={flashSale.bannerImageUrl!}
                alt={altText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1400px"
                quality={90}
                unoptimized
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-r from-secondary-950/75 via-secondary-950/40 to-transparent"
              />

              <div className="absolute inset-0 flex flex-col items-start justify-center gap-3 px-5 py-5 sm:gap-4 sm:px-8 lg:gap-5 lg:px-12">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
                  <BoltIcon className="h-4 w-4" aria-hidden="true" />
                  Flash Sale
                </span>
                <h2 className="max-w-2xl text-2xl font-extrabold leading-tight text-white drop-shadow sm:text-3xl lg:text-4xl">
                  {displayTitle}
                </h2>
                <div className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <FlashSaleCountdown endsAt={flashSale.endAt} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-2">
                <BoltIcon className="h-6 w-6 text-orange-500" aria-hidden="true" />
                <h2 className="text-xl font-bold text-secondary-900">{displayTitle}</h2>
              </div>
              <FlashSaleCountdown endsAt={flashSale.endAt} />
            </div>
          )}

          {/* ── Bottom block: applied products ────────────────────────────── */}
          <div className="border-t border-secondary-100 bg-secondary-50/60 p-5">
            <p className="mb-3 text-sm font-semibold text-secondary-900">
              Sản phẩm áp dụng
            </p>
            <ProductCardList products={[]} dtos={products} itemsPerRow={6} gap="sm" />
          </div>
        </article>
      </div>
    </section>
  );
}
