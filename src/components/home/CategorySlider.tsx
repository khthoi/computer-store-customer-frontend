"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { StorefrontCategoryShortcut } from "@/src/types/storefront-home.types";

export interface CategorySliderProps {
  items: StorefrontCategoryShortcut[];
}

export function CategorySlider({ items }: CategorySliderProps) {
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
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, updateButtons]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="quick-cat-heading"
      className="py-6 bg-white border-b border-secondary-100 rounded-md max-w-[1400px] mx-auto flex items-center"
    >
      <div className="w-full 2xl:max-w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="quick-cat-heading" className="text-lg font-bold text-secondary-900">
            Các sản phẩm phổ biến
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Danh mục trước"
              onClick={scrollPrev}
              disabled={!canScrollPrev && false}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 transition hover:border-primary-300 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Danh mục tiếp theo"
              onClick={scrollNext}
              disabled={!canScrollNext && false}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 transition hover:border-primary-300 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex touch-pan-y gap-3">
            {items.map((cat) => (
              <div
                key={cat.id}
                className="min-w-0 shrink-0 grow-0 basis-[calc(100%/3-10px)] sm:basis-[calc(100%/5-10px)] lg:basis-[calc(100%/8-11px)]"
              >
                <Link
                  href={cat.url}
                  className="group flex flex-col items-center justify-center gap-2 rounded-xl p-3 text-center transition-all duration-200 hover:bg-black/5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary-50 shrink-0">
                    {cat.iconUrl ? (
                      <Image
                        src={cat.iconUrl}
                        alt=""
                        width={32}
                        height={32}
                        unoptimized
                        aria-hidden="true"
                        className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                      />
                    ) : (
                      <span className="text-2xl leading-none">{cat.emoji ?? "🛒"}</span>
                    )}
                  </div>

                  <span className="text-[11px] sm:text-xs font-semibold leading-tight text-secondary-700 group-hover:text-primary-700 transition-colors">
                    {cat.label}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
