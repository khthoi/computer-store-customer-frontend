"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCompare } from "@/src/store/compare.store";
import { CompareHeaderCard } from "@/src/components/compare-ui/header/CompareHeaderCard";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareHeaderCardList — the product-card strip above the spec table.
 *
 * Responsibility: render one CompareHeaderCard per product in the compare list.
 * This is intentionally separate from CompareTable so the table can focus
 * purely on spec data and never need to know about card layout or animations.
 *
 * Layout:
 *   • Cards are arranged in a horizontal flex row.
 *   • Each card is flex-1 with a min-width of 240px so they expand equally
 *     on wide viewports and scroll horizontally on narrow ones.
 *   • AnimatePresence handles smooth entry/exit when products are added or
 *     removed from the compare list.
 */
export function CompareHeaderCardList() {
  const { state, removeProduct } = useCompare();
  const { compareList } = state;

  if (compareList.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-secondary-200 bg-white shadow-sm">
      <div className="flex items-stretch">
        <AnimatePresence mode="popLayout">
          {compareList.map((product, idx) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.2 }}
              className={[
                "min-w-[240px] flex-1 bg-white",
                idx > 0 ? "border-l border-secondary-200" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <CompareHeaderCard
                product={product}
                onRemove={() => removeProduct(product.id)}
                size="md"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
