import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { PublicBanner } from "@/src/types/storefront-banner.types";

export interface PromotionHeroBannerProps {
  banners: PublicBanner[];
}

const PLACEHOLDER_IMAGE = "/image-slide/slide01.jpg";

const COL_SPAN_CLASS: Record<number, string> = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
};

function clampSpan(value: number | null | undefined): 1 | 2 | 3 | 4 {
  const n = typeof value === "number" ? value : 2;
  if (n <= 1) return 1;
  if (n >= 4) return 4;
  return n as 2 | 3;
}

function bannerTileHref(b: PublicBanner): string | null {
  return b.linkUrl || (!b.linkUrl ? b.ctaUrl : null);
}

function bannerLinkTarget(b: PublicBanner): "_self" | "_blank" {
  return b.linkTarget === "_blank" ? "_blank" : "_self";
}

interface BannerGroupRow {
  rowKey: string;
  items: PublicBanner[];
}

/**
 * Group banners by gridY into rows; within each row, sort by gridX.
 * Banners without gridY/gridX (null) form a trailing fallback row sorted by
 * sortOrder.
 */
function groupBannersByRow(banners: PublicBanner[]): BannerGroupRow[] {
  const positioned = banners.filter((b) => b.gridY != null && b.gridX != null);
  const fallback = banners.filter((b) => b.gridY == null || b.gridX == null);

  const rowMap = new Map<number, PublicBanner[]>();
  for (const banner of positioned) {
    const row = banner.gridY ?? 0;
    const arr = rowMap.get(row) ?? [];
    arr.push(banner);
    rowMap.set(row, arr);
  }

  const rows: BannerGroupRow[] = [...rowMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([row, items]) => ({
      rowKey: `row-${row}`,
      items: items.slice().sort((a, b) => (a.gridX ?? 0) - (b.gridX ?? 0)),
    }));

  if (fallback.length > 0) {
    rows.push({
      rowKey: "row-fallback",
      items: fallback.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    });
  }

  return rows;
}

interface BannerTileProps {
  banner: PublicBanner;
  priority?: boolean;
}

function BannerTile({ banner, priority }: BannerTileProps) {
  const span = clampSpan(banner.gridW);
  const href = bannerTileHref(banner);
  const ctaHref = banner.ctaUrl;
  const target = bannerLinkTarget(banner);
  const altText = banner.altText ?? banner.title;
  const imageSrc = banner.imageUrl || PLACEHOLDER_IMAGE;

  const tileBody = (
    <>
      <Image
        src={imageSrc}
        alt={altText}
        fill
        sizes={
          span >= 3
            ? "(max-width: 768px) 100vw, 75vw"
            : span === 2
              ? "(max-width: 768px) 100vw, 50vw"
              : "(max-width: 768px) 100vw, 25vw"
        }
        priority={priority}
        quality={90}
        unoptimized
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-secondary-950/75 via-secondary-950/15 to-transparent"
      />

      {banner.badge ? (
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow"
          style={{
            backgroundColor: banner.badgeColor ?? "#ef4444",
            color: banner.badgeTextColor ?? "#ffffff",
          }}
        >
          {banner.badge}
        </span>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start gap-1.5 p-4 sm:p-5">
        {banner.overlayText ? (
          <p
            className={[
              "font-bold leading-tight text-white drop-shadow",
              span >= 3 ? "text-xl sm:text-3xl" : "text-base sm:text-lg",
            ].join(" ")}
          >
            {banner.overlayText}
          </p>
        ) : null}

        {banner.overlaySubtext ? (
          <p
            className={[
              "text-white/85 drop-shadow-sm",
              span >= 3 ? "text-sm sm:text-base" : "text-xs sm:text-sm",
            ].join(" ")}
          >
            {banner.overlaySubtext}
          </p>
        ) : null}

        {banner.ctaLabel ? (
          ctaHref ? (
            <Link
              href={ctaHref}
              target={target}
              className={[
                "relative z-20 mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5",
                "text-xs font-semibold text-white shadow-sm",
                "transition-all duration-200 hover:bg-primary-700 hover:gap-2",
                span >= 3 ? "sm:px-4 sm:py-2 sm:text-sm" : "",
              ].join(" ")}
            >
              {banner.ctaLabel}
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span
              className={[
                "relative z-20 mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5",
                "text-xs font-semibold text-white shadow-sm",
                span >= 3 ? "sm:px-4 sm:py-2 sm:text-sm" : "",
              ].join(" ")}
            >
              {banner.ctaLabel}
              <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )
        ) : null}
      </div>
    </>
  );

  const containerClass = [
    "group relative block aspect-[16/9] overflow-hidden rounded-2xl bg-secondary-200 shadow-sm transition-shadow hover:shadow-md sm:aspect-[2/1]",
    COL_SPAN_CLASS[span],
  ].join(" ");

  if (href) {
    return (
      <div className={containerClass}>
        <Link
          href={href}
          target={target}
          aria-label={altText}
          className="absolute inset-0 z-10"
        />
        {tileBody}
      </div>
    );
  }

  return (
    <div aria-label={altText} className={containerClass}>
      {tileBody}
    </div>
  );
}

/**
 * PromotionHeroBanner — renders banners using the grid layout configured in the
 * admin promotion-banner tab (gridY = row, gridX = column, gridW = column span).
 * Uses a responsive 4-column grid on md+; stacks to 2 columns on small screens.
 */
export function PromotionHeroBanner({ banners }: PromotionHeroBannerProps) {
  if (!banners || banners.length === 0) return null;

  const rows = groupBannersByRow(banners);

  return (
    <section
      aria-label="Banner khuyến mãi nổi bật"
      className="py-4 max-w-[1400px] mx-auto"
    >
      <div className="flex w-full flex-col gap-3 px-4 sm:px-6 lg:px-8 2xl:px-0">
        {rows.map((row, rowIndex) => (
          <div
            key={row.rowKey}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4"
          >
            {row.items.map((banner, itemIndex) => (
              <BannerTile
                key={banner.id}
                banner={banner}
                priority={rowIndex === 0 && itemIndex === 0}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
