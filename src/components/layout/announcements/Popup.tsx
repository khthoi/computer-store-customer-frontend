"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type {
  PopupPosition,
  StorefrontPopup,
} from "@/src/types/announcement.types";

interface Props {
  popup: StorefrontPopup;
  onDismissed: (id: string) => void;
}

const SESSION_FLAG_PREFIX = "popup_dismissed_";
const COOLDOWN_KEY_PREFIX = "popup_cooldown_at_";

function isCenter(position: PopupPosition): boolean {
  return position === "center";
}

function cornerClasses(position: PopupPosition): string {
  switch (position) {
    case "top_left":     return "fixed top-4 left-4";
    case "top_right":    return "fixed top-4 right-4";
    case "bottom_left":  return "fixed bottom-4 left-4";
    case "bottom_right": return "fixed bottom-4 right-4";
    default:             return "";
  }
}

export function Popup({ popup, onDismissed }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let scrollHandler: (() => void) | null = null;
    let exitHandler: ((e: MouseEvent) => void) | null = null;

    function show() {
      setOpen(true);
    }

    switch (popup.trigger) {
      case "on_load":
        show();
        break;
      case "on_delay": {
        const delay = Math.max(0, popup.delaySeconds ?? 0) * 1000;
        timer = setTimeout(show, delay);
        break;
      }
      case "on_scroll": {
        const target = popup.scrollPercent ?? 50;
        scrollHandler = () => {
          const doc = document.documentElement;
          const scrolled =
            (window.scrollY / Math.max(1, doc.scrollHeight - doc.clientHeight)) * 100;
          if (scrolled >= target) {
            show();
            if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
          }
        };
        window.addEventListener("scroll", scrollHandler, { passive: true });
        break;
      }
      case "on_exit":
        exitHandler = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            show();
            if (exitHandler) document.removeEventListener("mouseleave", exitHandler);
          }
        };
        document.addEventListener("mouseleave", exitHandler);
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
      if (exitHandler) document.removeEventListener("mouseleave", exitHandler);
    };
  }, [popup.trigger, popup.delaySeconds, popup.scrollPercent]);

  function handleClose() {
    setOpen(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `${COOLDOWN_KEY_PREFIX}${popup.id}`,
        String(Date.now()),
      );
      if (popup.showOnce) {
        window.sessionStorage.setItem(`${SESSION_FLAG_PREFIX}${popup.id}`, "1");
      }
    }
    onDismissed(popup.id);
  }

  if (!open) return null;

  const safeBody = DOMPurify.sanitize(popup.body);

  const panel = (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {popup.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={popup.imageUrl}
          alt={popup.title ?? popup.name}
          className="w-full h-auto object-cover"
        />
      )}
      <div className="p-5 space-y-3">
        {popup.title && (
          <h3 className="text-lg font-semibold text-slate-900">{popup.title}</h3>
        )}
        <div
          className="text-sm text-slate-700"
          dangerouslySetInnerHTML={{ __html: safeBody }}
        />
        {popup.ctaLabel && popup.ctaUrl && (
          <a
            href={popup.ctaUrl}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2"
          >
            {popup.ctaLabel}
          </a>
        )}
      </div>
      {popup.showCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng popup"
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-600 shadow"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  if (isCenter(popup.position)) {
    return (
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40"
        role="dialog"
        aria-modal="true"
      >
        <div className="relative w-full max-w-md">{panel}</div>
      </div>
    );
  }

  return (
    <div className={`${cornerClasses(popup.position)} z-[1000] w-full max-w-xs`} role="dialog">
      <div className="relative">{panel}</div>
    </div>
  );
}
