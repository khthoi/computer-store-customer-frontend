"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GalleryMedia {
  /** Unique key */
  key: string;
  /** Image or video source URL */
  src: string;
  alt: string;
  /** Thumbnail URL (falls back to src) */
  thumbnailSrc?: string;
  type?: "image" | "video";
}

export interface ProductImageGalleryProps {
  items: GalleryMedia[];
  /** Initial active index
   * @default 0
   */
  defaultIndex?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: {
  items: GalleryMedia[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef(0);
  const item = items[activeIndex];
  const total = items.length;

  const prev = useCallback(
    () => onNavigate((activeIndex - 1 + total) % total),
    [activeIndex, total, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((activeIndex + 1) % total),
    [activeIndex, total, onNavigate]
  );

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, []);

  // Focus close button on open
  useEffect(() => { closeRef.current?.focus(); }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [onClose, prev, next]
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/95 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const delta = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 50) delta > 0 ? next() : prev();
      }}
    >
      {/* ── Counter — top-left ── */}
      <span className="absolute top-4 left-5 z-20 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white select-none">
        {activeIndex + 1} / {total}
      </span>

      {/* ── Close — top-right ── */}
      <button
        ref={closeRef}
        type="button"
        aria-label="Đóng lightbox"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <XMarkIcon className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* ── Prev — left edge ── */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Ảnh trước"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronLeftIcon className="w-7 h-7" aria-hidden="true" />
        </button>
      )}

      {/* ── Next — right edge ── */}
      {total > 1 && (
        <button
          type="button"
          aria-label="Ảnh tiếp theo"
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ChevronRightIcon className="w-7 h-7" aria-hidden="true" />
        </button>
      )}

      {/* ── Media (animated) ── */}
      <div
        className="relative max-h-[85vh] max-w-[80vw] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex items-center justify-center"
          >
            {item.type === "video" ? (
              <video
                src={item.src}
                controls
                className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.src}
                alt={item.alt}
                className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Thumbnail strip — bottom ── */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 rounded bg-black/40 px-3 py-2 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, idx) => (
            <button
              key={it.key}
              type="button"
              aria-label={it.alt}
              aria-pressed={idx === activeIndex}
              onClick={() => onNavigate(idx)}
              className={[
                "h-10 w-10 shrink-0 overflow-hidden rounded border-2 transition-all",
                idx === activeIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80",
              ].join(" ")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.thumbnailSrc ?? it.src}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductImageGallery — main image + thumbnail strip with zoom on hover
 * and lightbox on click. Supports image and video media.
 *
 * ```tsx
 * <ProductImageGallery
 *   items={[
 *     { key: "front", src: "/images/product-front.jpg", alt: "Front view" },
 *     { key: "back",  src: "/images/product-back.jpg",  alt: "Back view" },
 *     { key: "video", src: "/videos/overview.mp4", alt: "Overview", type: "video" },
 *   ]}
 * />
 * ```
 */
export function ProductImageGallery({
  items,
  defaultIndex = 0,
  className = "",
}: ProductImageGalleryProps) {
  // All hooks must be called unconditionally before any early return.
  const [activeIndex, setActiveIndex] = useState(
    items.length > 0 ? clamp(defaultIndex, 0, items.length - 1) : 0
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleThumbnailKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (e.key === "ArrowRight") setActiveIndex(clamp(idx + 1, 0, items.length - 1));
      if (e.key === "ArrowLeft") setActiveIndex(clamp(idx - 1, 0, items.length - 1));
    },
    [items.length]
  );

  // Reset loaded state when active image changes
  useEffect(() => { setImgLoaded(false); }, [activeIndex]);

  // Guard: render placeholder when no media items are provided (after all hooks)
  if (items.length === 0) {
    return (
      <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
        <div className="aspect-square overflow-hidden rounded-xl border border-secondary-200 bg-secondary-100 flex items-center justify-center">
          <PhotoIcon className="h-20 w-20 text-secondary-300" aria-hidden="true" />
        </div>
      </div>
    );
  }

  const activeItem = items[activeIndex];

  return (
    <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
      {/* ── Main image ── */}
      <div
        className="group relative aspect-square overflow-hidden rounded-xl border border-secondary-200 bg-secondary-50 cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
        role="button"
        aria-label={`Open ${activeItem.alt} in lightbox`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
      >
        {/* Skeleton shimmer while loading */}
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-secondary-200" aria-hidden="true" />
        )}

        {activeItem.type === "video" ? (
          <div className="flex h-full w-full items-center justify-center">
            <video
              src={activeItem.src}
              className="h-full w-full object-contain"
              muted
              playsInline
              onLoadedData={() => setImgLoaded(true)}
            />
            <PlayIcon className="absolute w-12 h-12 text-white drop-shadow-lg" aria-hidden="true" />
          </div>
        ) : (
          <Image
            src={activeItem.src}
            alt={activeItem.alt}
            fill
            priority={activeIndex === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={[
              "object-contain p-6 transition-transform duration-300 group-hover:scale-110",
              imgLoaded ? "opacity-100" : "opacity-0",
            ].join(" ")}
            onLoad={() => setImgLoaded(true)}
          />
        )}

        {/* Zoom hint icon */}
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-secondary-500 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100"
        >
          <MagnifyingGlassPlusIcon className="w-4 h-4" />
        </span>
      </div>

      {/* ── Thumbnail strip ── */}
      {items.length > 1 && (
        <div
          role="tablist"
          aria-label="Product images"
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={item.alt}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => handleThumbnailKeyDown(e, idx)}
                className={[
                  "relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-secondary-50 transition-all duration-150",
                  isActive
                    ? "border-primary-500 shadow-sm"
                    : "border-secondary-200 hover:border-secondary-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                ].join(" ")}
              >
                {item.type === "video" ? (
                  <>
                    <video src={item.src} className="h-full w-full object-cover" muted />
                    <PlayIcon
                      className="absolute w-5 h-5 text-white drop-shadow"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  <Image
                    src={item.thumbnailSrc ?? item.src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <Lightbox
          items={items}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActiveIndex}
        />
      )}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name          Type            Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * items         GalleryMedia[]  required Media items to display
 * defaultIndex  number          0        Initially selected item index
 * className     string          ""       Extra classes on root div
 *
 * ─── GalleryMedia ─────────────────────────────────────────────────────────────
 *
 * Name          Type              Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * key           string            yes       Unique identifier
 * src           string            yes       Full-size media URL
 * alt           string            yes       Alt / accessible label
 * thumbnailSrc  string            no        Thumbnail URL (falls back to src)
 * type          "image"|"video"   no        Media type (default "image")
 */
