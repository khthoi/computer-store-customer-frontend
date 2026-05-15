"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { StorefrontAnnouncementBar } from "@/src/types/announcement.types";

interface Props {
  bar: StorefrontAnnouncementBar;
}

const DISMISS_KEY_PREFIX = "ann_bar_dismissed_";
const MARQUEE_GAP_PX = 64;
const MARQUEE_COPY_COUNT = 4;
const MARQUEE_DURATION_SECONDS = 40;

export function AnnouncementBar({ bar }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHydrated(true);
      const flag = window.localStorage.getItem(`${DISMISS_KEY_PREFIX}${bar.id}`);
      if (flag === "1") setDismissed(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [bar.id]);

  if (!hydrated || dismissed) return null;

  const safeHtml = DOMPurify.sanitize(bar.content);

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${DISMISS_KEY_PREFIX}${bar.id}`, "1");
    }
  }

  // Render 2 identical halves (4 copies each) so translating exactly 50% of
  // the track width produces a seamless loop with no visual reset.
  const marqueeContent = bar.isScrolling ? (
    <div className="flex-1 overflow-hidden">
      <div
        className="marquee-track"
        style={{
          animationDuration: `${MARQUEE_DURATION_SECONDS}s`,
          transform: "translateX(0)",
        }}
      >
        {Array.from({ length: 2 }, (_, groupIndex) => (
          <div key={groupIndex} className="flex shrink-0 items-center">
            {Array.from({ length: MARQUEE_COPY_COUNT }, (_, index) => {
              const copyIndex = groupIndex * MARQUEE_COPY_COUNT + index;
              return (
                <span
                  key={copyIndex}
                  className="announcement-marquee-copy inline-flex shrink-0 items-center whitespace-nowrap"
                  aria-hidden={copyIndex > 0 ? "true" : undefined}
                  style={{ paddingRight: `${MARQUEE_GAP_PX}px` }}
                  dangerouslySetInnerHTML={{ __html: safeHtml }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div
      className="flex-1 text-center truncate"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );

  const hasCta = Boolean(bar.linkUrl && bar.linkLabel);

  return (
    <div
      className="w-full text-sm font-medium overflow-hidden"
      style={{ backgroundColor: bar.backgroundColor, color: bar.textColor }}
      role="status"
    >
      <div className="flex items-center gap-3 px-4 py-2 mx-auto max-w-screen-2xl">
        {marqueeContent}

        {(bar.showCloseButton || hasCta) && (
          <div className="flex items-center gap-2 shrink-0">
            {bar.showCloseButton && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Đóng thông báo"
                className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"
                style={{ color: bar.textColor }}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}

            {hasCta && (
              <a
                href={bar.linkUrl as string}
                className="whitespace-nowrap underline decoration-current underline-offset-2 hover:decoration-current"
                style={{ color: bar.textColor }}
              >
                {bar.linkLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
