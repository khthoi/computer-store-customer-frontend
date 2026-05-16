"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ProductCard, type ProductCardProps } from "./ProductCard";
import { ProductCardConnected } from "./ProductCardConnected";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SlideProduct = Omit<ProductCardProps, "onAddToCart" | "onCompare" | "onWishlistToggle">;

export interface ProductCarouselProps {
  products: SlideProduct[];
  /**
   * When provided, the carousel renders `ProductCardConnected` for each DTO
   * so cart / wishlist / compare actions are wired automatically.
   * `products` is ignored in this mode — pass either `products` OR `dtos`.
   */
  dtos?: StorefrontProductCardDto[];
  /** If true, show a skeleton row while data is loading */
  loading?: boolean;
  /**
   * Number of cards visible at the widest breakpoint (2xl ≥ 1536 px).
   * Breakpoint ladder: mobile→2 · sm→3 · lg→4 · xl→5 · 2xl→itemsPerView
   * Default: 6
   */
  itemsPerView?: 4 | 5 | 6;
}

// ─── Slide basis lookup ───────────────────────────────────────────────────────
// Tailwind requires static class strings — no template literals.
// mobile(2) and sm(3) are fixed; lg(4) and xl(5) are fixed stepping-stones;
// the 2xl column is the only breakpoint that changes with itemsPerView.

// Each slide carries its own left padding (pl-3 = 12 px) instead of relying on
// CSS `gap` on the flex container. The track has a matching negative left margin
// (-ml-3) so the first slide still aligns to the left edge of the viewport.
// This is the canonical Embla approach: padding-based gaps work correctly with
// loop:true because cloned slides inherit the same padding.
const SLIDE_CLASSES: Record<4 | 5 | 6, string> = {
  4: "min-w-0 shrink-0 grow-0 h-full pl-3 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/4",
  5: "min-w-0 shrink-0 grow-0 h-full pl-3 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5",
  6: "min-w-0 shrink-0 grow-0 h-full pl-3 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5 2xl:basis-1/6",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductCarousel — infinite-loop horizontal slider of ProductCard items.
 *
 * Responsive visible counts (controlled via CSS flex-basis):
 *   Mobile  → 2   always
 *   sm      → 3   always
 *   lg      → 4   always
 *   xl      → 5   always
 *   2xl     → itemsPerView (4 | 5 | 6 — default 6)
 *
 * Uses Embla Carousel with loop:true for seamless infinite looping.
 * Drag (mouse) and swipe (touch) are enabled by default in Embla.
 */
export function ProductCarousel({ products, dtos, itemsPerView = 6 }: ProductCarouselProps) {
  const slideClass = SLIDE_CLASSES[itemsPerView];
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    dragFree: false,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(true);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    // With loop:true these are always true, but we track state
    // for potential future non-loop usage.
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const hasDtos = !!dtos && dtos.length > 0;
  if (!hasDtos && products.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {/* ── Viewport ── */}
      <div ref={emblaRef} className="overflow-hidden">
        {/* -ml-3 offsets the first slide's pl-3 so content aligns to left edge */}
        <div className="flex touch-pan-y items-stretch -ml-3">
          {dtos && dtos.length > 0
            ? dtos.map((dto) => (
                <div key={dto.variantId || dto.id} className={slideClass}>
                  <ProductCardConnected dto={dto} />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className={slideClass}>
                  <ProductCard {...product} />
                </div>
              ))}
        </div>
      </div>

      {/* ── Previous button ── */}
      <button
        type="button"
        aria-label="Sản phẩm trước"
        onClick={scrollPrev}
        disabled={!canScrollPrev}
        className={[
          // Centered vertically on the card image area (~50% of card height)
          "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10",
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-white border border-secondary-200 shadow-md text-secondary-600",
          "transition-all duration-150",
          "opacity-0 group-hover/carousel:opacity-100",
          "hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
          "disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── Next button ── */}
      <button
        type="button"
        aria-label="Sản phẩm tiếp theo"
        onClick={scrollNext}
        disabled={!canScrollNext}
        className={[
          "absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10",
          "flex h-9 w-9 items-center justify-center rounded-full",
          "bg-white border border-secondary-200 shadow-md text-secondary-600",
          "transition-all duration-150",
          "opacity-0 group-hover/carousel:opacity-100",
          "hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
          "disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
