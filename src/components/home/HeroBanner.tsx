"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { StorefrontBanner } from "@/src/types/storefront-home.types";

export interface HeroBannerProps {
  hero: StorefrontBanner | null;
  heroSlides: StorefrontBanner[];
  smallPromos: StorefrontBanner[];
}

type CarouselDotTheme = "light" | "dark" | "mixed";
const AUTOPLAY_INTERVAL_MS = 5000;
const AUTOPLAY_RESUME_DELAY_MS = 60_000;

function getDesktopImageUrl(banner: StorefrontBanner) {
  return banner.imageUrl || banner.mobileImageUrl || "";
}

function getMobileImageUrl(banner: StorefrontBanner) {
  return banner.mobileImageUrl || banner.imageUrl || "";
}

async function detectImageBrightness(src: string): Promise<CarouselDotTheme | null> {
  if (typeof window === "undefined" || !src) {
    return null;
  }

  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });

        if (!context) {
          resolve(null);
          return;
        }

        canvas.width = 24;
        canvas.height = 24;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Sample the lower content area because overlay text and CTA sit near the bottom.
        const sampleY = Math.floor(canvas.height * 0.55);
        const sampleHeight = canvas.height - sampleY;
        const { data } = context.getImageData(0, sampleY, canvas.width, sampleHeight);
        const pixelCount = data.length / 4;
        let totalLuminance = 0;

        for (let index = 0; index < data.length; index += 4) {
          const red = data[index];
          const green = data[index + 1];
          const blue = data[index + 2];
          totalLuminance += (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
        }

        const averageLuminance = totalLuminance / pixelCount;
        resolve(averageLuminance >= 160 ? "light" : "dark");
      } catch {
        resolve(null);
      }
    };

    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function BannerImage({
  banner,
  priority = false,
  className,
}: {
  banner: StorefrontBanner;
  priority?: boolean;
  className: string;
}) {
  const desktopSrc = getDesktopImageUrl(banner);
  const mobileSrc = getMobileImageUrl(banner);
  const hasDistinctMobile = Boolean(
    banner.mobileImageUrl &&
    banner.imageUrl &&
    banner.mobileImageUrl !== banner.imageUrl,
  );

  if (!desktopSrc) {
    return null;
  }

  return (
    <>
      {hasDistinctMobile ? (
        <Image
          src={mobileSrc}
          alt={banner.altText || banner.title || "Banner"}
          priority={priority}
          fill
          sizes="100vw"
          quality={90}
          unoptimized
          className={`${className} sm:hidden`}
        />
      ) : null}

      <Image
        src={desktopSrc}
        alt={banner.altText || banner.title || "Banner"}
        priority={priority}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1400px) 100vw, 1400px"
        quality={90}
        unoptimized
        className={hasDistinctMobile ? `${className} hidden sm:block` : className}
      />
    </>
  );
}

function getLinkTargetProps(banner: StorefrontBanner) {
  return banner.linkTarget === "_blank"
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
}

function BannerOverlay({
  banner,
  compact = false,
  theme = "mixed",
}: {
  banner: StorefrontBanner;
  compact?: boolean;
  theme?: CarouselDotTheme;
}) {
  const hasOverlay = Boolean(
    banner.badge ||
    banner.overlayText ||
    banner.overlaySubtext ||
    (banner.ctaLabel && banner.ctaUrl),
  );

  if (!hasOverlay) {
    return null;
  }

  return (
    <div
      className={[
        "absolute inset-0 flex flex-col justify-end transition-colors",
        theme === "light"
          ? "bg-gradient-to-t from-white/88 via-white/42 to-transparent"
          : "bg-gradient-to-t from-black/70 via-black/25 to-transparent",
        compact ? "px-4 py-4" : "px-5 py-5 sm:px-7 sm:py-7",
      ].join(" ")}
    >
      {banner.badge && (
        <span
          className="mb-3 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold shadow-sm"
          style={{
            backgroundColor: banner.badgeColor ?? "#ef4444",
            color: banner.badgeTextColor ?? "#ffffff",
          }}
        >
          {banner.badge}
        </span>
      )}

      {banner.overlayText && (
        <p
          className={[
            "max-w-3xl font-bold leading-tight",
            theme === "light" ? "text-secondary-950 drop-shadow-sm" : "text-white drop-shadow-md",
            compact ? "text-lg" : "text-xl sm:text-3xl lg:text-4xl",
          ].join(" ")}
        >
          {banner.overlayText}
        </p>
      )}

      {banner.overlaySubtext && (
        <p
          className={[
            "mt-2 max-w-2xl",
            theme === "light" ? "text-secondary-800/90" : "text-white/90 drop-shadow-sm",
            compact ? "text-sm line-clamp-2" : "text-sm sm:text-base",
          ].join(" ")}
        >
          {banner.overlaySubtext}
        </p>
      )}

      {banner.ctaLabel && banner.ctaUrl && (
        <div className="mt-4 pointer-events-auto">
          <Link
            href={banner.ctaUrl}
            {...getLinkTargetProps(banner)}
            className={[
              "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-md transition",
              theme === "light"
                ? "bg-secondary-950 text-white hover:bg-secondary-800"
                : "bg-white text-secondary-900 hover:bg-primary-50 hover:text-primary-700",
            ].join(" ")}
          >
            {banner.ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

function BannerCaption({ caption }: { caption: string | null }) {
  if (!caption) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-secondary-500">
      {caption}
    </p>
  );
}

function BannerCard({
  banner,
  priority = false,
  aspectClass,
  compact = false,
  theme = "mixed",
}: {
  banner: StorefrontBanner;
  priority?: boolean;
  aspectClass: string;
  compact?: boolean;
  theme?: CarouselDotTheme;
}) {
  const linkProps = getLinkTargetProps(banner);
  const hasBannerLink = Boolean(banner.linkUrl);

  return (
    <div className="flex h-full flex-col">
      <div className={`group relative overflow-hidden rounded-xl bg-secondary-200 shadow-sm ${aspectClass}`}>
        <BannerImage
          banner={banner}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />

        {hasBannerLink && banner.linkUrl && (
          <Link
            href={banner.linkUrl}
            {...linkProps}
            aria-label={banner.altText || banner.title || "Mo banner"}
            className="absolute inset-0 z-0"
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-10">
          <BannerOverlay banner={banner} compact={compact} theme={theme} />
        </div>
      </div>
      <BannerCaption caption={banner.caption} />
    </div>
  );
}

export function HeroBanner({ hero, heroSlides, smallPromos }: HeroBannerProps) {
  const primarySlides = heroSlides.filter(
    (item) => getDesktopImageUrl(item) || getMobileImageUrl(item),
  );
  const fallbackHero = hero && (getDesktopImageUrl(hero) || getMobileImageUrl(hero)) ? [hero] : [];
  const slides = primarySlides.length > 0 ? primarySlides : fallbackHero;

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
    align: "start",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(slides.length > 1);
  const [canScrollNext, setCanScrollNext] = useState(slides.length > 1);
  const [dotThemes, setDotThemes] = useState<Record<string, CarouselDotTheme>>({});
  const [pauseAutoplayUntil, setPauseAutoplayUntil] = useState<number | null>(null);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    typeof document === "undefined" ? true : document.visibilityState === "visible",
  );

  const updateCarouselState = useCallback(() => {
    if (!emblaApi) {
      return;
    }

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const syncState = window.setTimeout(updateCarouselState, 0);
    const handlePointerDown = () => {
      setPauseAutoplayUntil(Date.now() + AUTOPLAY_RESUME_DELAY_MS);
    };

    emblaApi.on("select", updateCarouselState);
    emblaApi.on("reInit", updateCarouselState);
    emblaApi.on("pointerDown", handlePointerDown);

    return () => {
      window.clearTimeout(syncState);
      emblaApi.off("select", updateCarouselState);
      emblaApi.off("reInit", updateCarouselState);
      emblaApi.off("pointerDown", handlePointerDown);
    };
  }, [emblaApi, updateCarouselState]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (pauseAutoplayUntil === null) {
      return;
    }

    const remainingTime = pauseAutoplayUntil - Date.now();

    if (remainingTime <= 0) {
      const resetTimer = window.setTimeout(() => {
        setPauseAutoplayUntil(null);
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const timer = window.setTimeout(() => {
      setPauseAutoplayUntil(null);
    }, remainingTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pauseAutoplayUntil]);

  useEffect(() => {
    if (!emblaApi || slides.length <= 1 || !isDocumentVisible || pauseAutoplayUntil !== null) {
      return;
    }

    const timer = window.setInterval(() => {
      emblaApi.scrollNext();
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [emblaApi, isDocumentVisible, pauseAutoplayUntil, slides.length]);

  useEffect(() => {
    let isCancelled = false;

    if (slides.length === 0) {
      const resetTimer = window.setTimeout(() => {
        setDotThemes({});
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const resolveDotThemes = async () => {
      const entries = await Promise.all(
        slides.map(async (slide) => {
          const detectedTheme = await detectImageBrightness(getDesktopImageUrl(slide));
          return [slide.id, detectedTheme ?? "mixed"] as const;
        }),
      );

      if (isCancelled) {
        return;
      }

      setDotThemes(Object.fromEntries(entries));
    };

    void resolveDotThemes();

    return () => {
      isCancelled = true;
    };
  }, [slides]);

  const pauseAutoplay = useCallback(() => {
    setPauseAutoplayUntil(Date.now() + AUTOPLAY_RESUME_DELAY_MS);
  }, []);

  const scrollPrev = useCallback(() => {
    pauseAutoplay();
    emblaApi?.scrollPrev();
  }, [emblaApi, pauseAutoplay]);

  const scrollNext = useCallback(() => {
    pauseAutoplay();
    emblaApi?.scrollNext();
  }, [emblaApi, pauseAutoplay]);

  const scrollTo = useCallback((index: number) => {
    pauseAutoplay();
    emblaApi?.scrollTo(index);
  }, [emblaApi, pauseAutoplay]);
  const currentSlide = slides[selectedIndex] ?? slides[0] ?? null;
  const currentDotTheme = currentSlide ? (dotThemes[currentSlide.id] ?? "mixed") : "mixed";

  if (slides.length === 0 && smallPromos.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Banner khuyến mãi"
      className="mx-auto flex max-w-[1400px] items-center bg-secondary-50 py-4"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="flex flex-col gap-3">
          {slides.length > 0 && (
            <div className="relative">
              <div ref={emblaRef} className="overflow-hidden rounded-xl">
                <div className="flex">
                  {slides.map((banner, index) => (
                    <div key={banner.id} className="min-w-0 shrink-0 grow-0 basis-full">
                      <BannerCard
                        banner={banner}
                        priority={index === 0}
                        aspectClass="aspect-[21/7]"
                        theme={dotThemes[banner.id] ?? "mixed"}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Slide trước"
                    onClick={scrollPrev}
                    disabled={!canScrollPrev && slides.length <= 1}
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-secondary-700 shadow-sm transition hover:bg-white hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Slide tiếp theo"
                    onClick={scrollNext}
                    disabled={!canScrollNext && slides.length <= 1}
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-secondary-700 shadow-sm transition hover:bg-white hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-40"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                  <div
                    className={[
                      "absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 backdrop-blur-sm transition-colors",
                      currentDotTheme === "light"
                        ? "border border-secondary-900/10 bg-white/82 shadow-sm"
                        : currentDotTheme === "dark"
                          ? "border border-white/20 bg-secondary-950/32 shadow-lg"
                          : "border border-white/35 bg-black/25 shadow-lg",
                    ].join(" ")}
                  >
                    {slides.map((banner, index) => (
                      <button
                        key={`${banner.id}-dot`}
                        type="button"
                        aria-label={`Đi tới slide ${index + 1}`}
                        onClick={() => scrollTo(index)}
                        className={[
                          "rounded-full transition-all focus-visible:outline-none focus-visible:ring-2",
                          index === selectedIndex
                            ? currentDotTheme === "light"
                              ? "h-2.5 w-7 bg-secondary-900 focus-visible:ring-secondary-900/35"
                              : currentDotTheme === "dark"
                                ? "h-2.5 w-7 bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.22)] focus-visible:ring-white/70"
                                : "h-2.5 w-7 bg-white ring-1 ring-secondary-900/25 focus-visible:ring-white/80"
                            : currentDotTheme === "light"
                              ? "h-2.5 w-2.5 bg-secondary-900/38 hover:bg-secondary-900/68 focus-visible:ring-secondary-900/35"
                              : currentDotTheme === "dark"
                                ? "h-2.5 w-2.5 bg-white/55 hover:bg-white/82 focus-visible:ring-white/70"
                                : "h-2.5 w-2.5 bg-white/72 ring-1 ring-secondary-900/20 hover:bg-white focus-visible:ring-white/80",
                        ].join(" ")}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {smallPromos.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {smallPromos.slice(0, 4).map((banner) => {
                if (!getDesktopImageUrl(banner) && !getMobileImageUrl(banner)) {
                  return null;
                }

                return (
                  <BannerCard
                    key={banner.id}
                    banner={banner}
                    aspectClass="aspect-[4/3]"
                    compact
                    theme={dotThemes[banner.id] ?? "mixed"}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
