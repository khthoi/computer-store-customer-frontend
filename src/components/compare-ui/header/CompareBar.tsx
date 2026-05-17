"use client";

import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { CompareHeaderCard } from "@/src/components/compare-ui/header/CompareHeaderCard";
import { useCompare } from "@/src/store/compare.store";

const MAX_COMPARE = 4;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareBar — sticky bar below the navbar showing selected products.
 *
 * Exposes a CSS custom property `--compare-bar-height` on its root element
 * so CompareTable can use `calc(64px + var(--compare-bar-height))` for the
 * sticky product-header offset.
 */
export function CompareBar() {
  const { state, removeProduct, clearAll, openDrawer } = useCompare();
  const { compareList } = state;
  const activeCategoryLabel = compareList[0]?.rootCategoryName ?? null;
  const barRef = useRef<HTMLDivElement>(null);

  // Publish bar height as a CSS custom property on <body>
  useEffect(() => {
    if (!barRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        "--compare-bar-height",
        `${entry.contentRect.height}px`
      );
    });
    obs.observe(barRef.current);
    return () => obs.disconnect();
  }, []);

  const emptySlots = MAX_COMPARE - compareList.length;

  return (
    <div
      ref={barRef}
      className="w-full z-40 border-b border-secondary-200 bg-white shadow-sm mt-3"
    >
      <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* ── Left: selected products + empty slots ── */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <AnimatePresence mode="popLayout">
            {compareList.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ duration: 0.18 }}
              >
                <CompareHeaderCard
                  product={p}
                  onRemove={() => removeProduct(p.id)}
                  size="sm"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty slot buttons */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`slot-${i}`}
              type="button"
              aria-label="Thêm sản phẩm để so sánh"
              onClick={openDrawer}
              className={[
                "flex h-20 w-36 shrink-0 cursor-pointer flex-col items-center justify-center gap-1",
                "rounded-xl border-2 border-dashed border-secondary-300",
                "text-xs text-secondary-400",
                "transition-colors hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              ].join(" ")}
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              <span>Thêm sản phẩm</span>
            </button>
          ))}
        </div>

        {/* ── Right: category indicator + clear button ── */}
        <div className="flex shrink-0 items-center gap-3">
          {activeCategoryLabel && (
            <Badge variant="primary" size="sm" dot>
              {activeCategoryLabel}
            </Badge>
          )}

          {compareList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              leftIcon={<TrashIcon className="h-4 w-4" aria-hidden="true" />}
            >
              Xóa tất cả
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
