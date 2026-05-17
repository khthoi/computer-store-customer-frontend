"use client";

import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareHighlightToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareHighlightToggle — animated pill switch.
 *
 * ```tsx
 * <CompareHighlightToggle value={showDiffs} onChange={setShowDiffs} />
 * ```
 */
export function CompareHighlightToggle({
  value,
  onChange,
}: CompareHighlightToggleProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        id="diff-toggle-label"
        className="select-none text-sm text-secondary-600"
      >
        Chỉ hiển thị điểm khác biệt
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-labelledby="diff-toggle-label"
        onClick={() => onChange(!value)}
        className={[
          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full",
          "transition-colors duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          value ? "bg-primary-500" : "bg-secondary-200",
        ].join(" ")}
      >
        <span className="sr-only">
          {value ? "Đang lọc điểm khác biệt" : "Hiển thị tất cả thông số"}
        </span>
        <motion.span
          layout
          animate={{ x: value ? 20 : 2 }}
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none absolute top-1 inline-block h-4 w-4 rounded-full bg-white shadow"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
