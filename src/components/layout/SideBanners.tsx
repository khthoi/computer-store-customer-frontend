"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { SideBanner } from "@/src/components/ui/SideBanner";
import type { StorefrontBanner } from "@/src/types/storefront-home.types";

const HEADER_GAP = 16;
const FALLBACK_TOP = 96;
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

  useLayoutEffect(() => {
    function update() {
      cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const refs = [leftRef.current, rightRef.current].filter(Boolean) as HTMLDivElement[];

        if (refs.length === 0) {
          return;
        }

        // Re-query header/footer every tick — Next.js route changes can
        // replace the footer element while this effect's dependencies stay
        // the same, leaving cached references pointing at detached nodes.
        const footer = document.querySelector("footer");
        const header = document.querySelector("header");

        const headerBottom = header?.getBoundingClientRect().bottom ?? (FALLBACK_TOP - HEADER_GAP);
        let top = Math.max(FALLBACK_TOP, headerBottom + HEADER_GAP);

        if (footer) {
          const footerRect = footer.getBoundingClientRect();
          // Treat a fully-off-screen footer as "no collision" so banners do
          // not get pushed into negative positions during scroll-up after
          // the footer has left the viewport above.
          if (footerRect.bottom > 0) {
            const bannerHeight = refs[0].offsetHeight;
            const bannerBottom = top + bannerHeight;
            const collisionPoint = bannerBottom + FOOTER_GAP;
            if (footerRect.top <= collisionPoint) {
              const constrainedTop = footerRect.top - bannerHeight - FOOTER_GAP;
              top = Math.max(FALLBACK_TOP - bannerHeight, constrainedTop);
            }
          }
        }

        refs.forEach((node) => {
          node.style.top = `${top}px`;
        });
      });
    }

    update();
    const secondFrameId = window.requestAnimationFrame(update);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("load", update);

    // Observe DOM mutations so banners reposition when the page layout
    // changes (e.g., long async sections finish loading and shift the
    // footer). Without this, the position calculated on first paint can
    // become stale and the banner appears to "disappear" off-screen.
    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("load", update);
      window.cancelAnimationFrame(secondFrameId);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [leftBanner, rightBanner, pathname]);

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
          style={{ top: FALLBACK_TOP }}
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
          style={{ top: FALLBACK_TOP }}
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
