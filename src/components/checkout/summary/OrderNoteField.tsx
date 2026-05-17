"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useCheckout } from "@/src/store/checkout.store";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderNoteField — collapsible optional textarea for order notes.
 *
 * Collapsed by default; expands when the user clicks the toggle.
 * Writes directly to checkout store via setField("note", …).
 */
export function OrderNoteField() {
  const { state, setField } = useCheckout();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-5 pt-5 border-t border-secondary-100">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 text-sm text-secondary-500 hover:text-primary-600 transition-colors"
      >
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
        Thêm ghi chú đơn hàng
      </button>

      {expanded && (
        <textarea
          aria-label="Ghi chú đơn hàng"
          className={[
            "mt-3 w-full rounded border border-secondary-300 bg-white",
            "px-3 py-2 text-sm text-secondary-700 placeholder:text-secondary-400",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/15",
            "resize-none transition-colors duration-150",
          ].join(" ")}
          rows={3}
          placeholder="Ghi chú thêm cho đơn hàng (tùy chọn)…"
          value={state.form.note}
          onChange={(e) => setField("note", e.target.value)}
        />
      )}
    </div>
  );
}
