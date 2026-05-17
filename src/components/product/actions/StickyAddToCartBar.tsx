"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingCartIcon, BoltIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { formatVND } from "@/src/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StickyAddToCartBarProps {
  productName: string;
  currentPrice: number;
  thumbnailSrc: string;
  thumbnailAlt: string;
  onAddToCart: () => void;
  onBuyNow: () => void;
  isAddingToCart: boolean;
  ctaRef: RefObject<HTMLDivElement | null>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StickyAddToCartBar({
  productName,
  currentPrice,
  thumbnailSrc,
  thumbnailAlt,
  onAddToCart,
  onBuyNow,
  isAddingToCart,
  ctaRef,
}: StickyAddToCartBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the sticky bar when the main CTA is NOT visible
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ctaRef]);

  const shortName =
    productName.length > 40
      ? productName.slice(0, 38) + "…"
      : productName;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* ── Mobile: fixed bottom bar ── */}
          <motion.div
            key="sticky-mobile"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="region"
            aria-label="Thanh thêm vào giỏ hàng nhanh"
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-secondary-200 shadow-2xl px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailSrc}
                alt={thumbnailAlt}
                width={40}
                height={40}
                className="w-10 h-10 rounded-md object-cover border border-secondary-200 shrink-0"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-secondary-900 truncate">
                  {shortName}
                </p>
                <p className="text-sm font-bold text-primary-700">
                  {formatVND(currentPrice)}
                </p>
              </div>

              {/* CTA */}
              <Button
                variant="primary"
                size="sm"
                isLoading={isAddingToCart}
                onClick={onAddToCart}
                leftIcon={<ShoppingCartIcon className="w-4 h-4" />}
                className="shrink-0"
              >
                Thêm vào giỏ
              </Button>
            </div>
          </motion.div>

          {/* ── Desktop: fixed top bar ── */}
          <motion.div
            key="sticky-desktop"
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            exit={{ y: -80 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="region"
            aria-label="Thanh thêm vào giỏ hàng nhanh"
            className="hidden lg:block fixed top-14 left-0 right-0 z-40 bg-white border-b border-secondary-200 shadow-md"
          >
            <div className="max-w-screen-xl mx-auto flex items-center gap-4 px-8 py-3">
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailSrc}
                alt={thumbnailAlt}
                width={44}
                height={44}
                className="w-11 h-11 rounded-md object-cover border border-secondary-200 shrink-0"
              />

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-secondary-900 truncate max-w-md">
                  {productName}
                </p>
                <p className="text-sm font-bold text-primary-700">
                  {formatVND(currentPrice)}
                </p>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isAddingToCart}
                  onClick={onAddToCart}
                  leftIcon={<ShoppingCartIcon className="w-4 h-4" />}
                >
                  Thêm vào giỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onBuyNow}
                  leftIcon={<BoltIcon className="w-4 h-4" />}
                >
                  Mua ngay
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
