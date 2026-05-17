"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DescriptionTabProps {
  /** Safe, sanitized HTML string */
  htmlContent: string;
}

const COLLAPSED_HEIGHT = 384;

// ─── Component ────────────────────────────────────────────────────────────────

export function DescriptionTab({ htmlContent }: DescriptionTabProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : COLLAPSED_HEIGHT }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div
          className={[
            "prose max-w-none",
            "prose-headings:text-secondary-900 prose-headings:font-semibold",
            "prose-p:text-secondary-700 prose-p:leading-relaxed",
            "prose-li:text-secondary-700 prose-li:marker:text-primary-400",
            "prose-strong:text-secondary-900",
            "prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline",
            "prose-img:rounded-xl prose-img:shadow-sm",
            "prose-table:border prose-table:border-secondary-200",
            "prose-th:bg-secondary-50 prose-th:text-secondary-700",
          ].join(" ")}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </motion.div>

      {/* Gradient fade overlay + floating toggle when collapsed */}
      {!expanded && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-32 items-end justify-center bg-gradient-to-t from-white via-white/85 to-transparent pb-2"
        >
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white px-4 py-1.5 text-sm font-semibold text-primary-700 shadow-md transition-colors hover:bg-primary-50 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Xem thêm nội dung
            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Collapse toggle when expanded */}
      {expanded && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 underline-offset-4 transition-colors hover:text-primary-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
          >
            Thu gọn
            <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
