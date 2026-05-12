"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { SideBanner } from "@/src/components/ui/SideBanner";
import type { StorefrontBanner } from "@/src/types/storefront-home.types";

const BANNER_TOP = 160;
const FOOTER_GAP = 24;

function getRenderableSideBanner(
  banners: StorefrontBanner[],
  placement: "left" | "right",
): StorefrontBanner | null {
  return banners.find(
    (banner) =>
      banner.position === "side_banner" &&
      banner.sidePlacement === placement &&
      Boolean(banner.imageUrl || banner.mobileImageUrl),
  ) ?? null;
}

export function SideBanners({ banners }: { banners: StorefrontBanner[] }) {
  const pathname = usePathname();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const leftBanner = useMemo(() => getRenderableSideBanner(banners, "left"), [banners]);
  const rightBanner = useMemo(() => getRenderableSideBanner(banners, "right"), [banners]);

  useEffect(() => {
    const footer = document.querySelector("footer");

    function update() {
      cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const refs = [leftRef.current, rightRef.current].filter(Boolean) as HTMLDivElement[];

        if (refs.length === 0) {
          return;
        }

        let top = BANNER_TOP;

        if (footer) {
          const footerTop = footer.getBoundingClientRect().top;
          const bannerHeight = refs[0].offsetHeight;
          const bannerBottom = BANNER_TOP + bannerHeight;
          const collisionPoint = bannerBottom + FOOTER_GAP;

          if (footerTop <= collisionPoint) {
            top = footerTop - bannerHeight - FOOTER_GAP;
          }
        }

        refs.forEach((node) => {
          node.style.top = `${top}px`;
        });
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });

    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(rafRef.current);
    };
  }, [leftBanner, rightBanner]);

  if (pathname.startsWith("/account")) return null;
  if (!leftBanner && !rightBanner) return null;

  const colCls = "pointer-events-none fixed z-30 hidden 2xl:block";

  return (
    <>
      {leftBanner ? (
        <div
          ref={leftRef}
          aria-hidden="true"
          className={`${colCls} left-6`}
          style={{ top: BANNER_TOP }}
        >
          <div className="pointer-events-auto">
            <SideBanner
              image={leftBanner.imageUrl || leftBanner.mobileImageUrl || ""}
              alt={leftBanner.altText || leftBanner.title || "Side banner trái"}
              href={leftBanner.linkUrl || "/"}
              target={leftBanner.linkTarget === "_blank" ? "_blank" : "_self"}
            />
          </div>
        </div>
      ) : null}

      {rightBanner ? (
        <div
          ref={rightRef}
          aria-hidden="true"
          className={`${colCls} right-6`}
          style={{ top: BANNER_TOP }}
        >
          <div className="pointer-events-auto">
            <SideBanner
              image={rightBanner.imageUrl || rightBanner.mobileImageUrl || ""}
              alt={rightBanner.altText || rightBanner.title || "Side banner phải"}
              href={rightBanner.linkUrl || "/"}
              target={rightBanner.linkTarget === "_blank" ? "_blank" : "_self"}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
