"use client";

import { useRef } from "react";
import { Badge } from "@/src/components/ui/Badge";
import { CompareBar } from "@/src/components/compare-ui/CompareBar";
import { CompareHeaderCardList } from "@/src/components/compare-ui/CompareHeaderCardList";
import { CompareTable } from "@/src/components/compare-ui/CompareTable";
import { CompareProductDrawer } from "@/src/components/compare-ui/CompareProductDrawer";
import { CompareDataBridge } from "@/src/components/compare-ui/CompareDataBridge";
import { EmptyCompareState } from "@/src/components/compare-ui/EmptyCompareState";
import { useCompare } from "@/src/store/compare.store";
import {
  CATEGORY_LABELS,
  type CatalogueProduct,
} from "@/src/components/compare-ui/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComparePageClientProps {
  catalogue: CatalogueProduct[];
  suggestedProducts: CatalogueProduct[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparePageClient({
  catalogue,
  suggestedProducts,
}: ComparePageClientProps) {
  const { state } = useCompare();
  const { compareList, activeCategory } = state;
  const tableRef = useRef<HTMLDivElement>(null);
  const hasEnough = compareList.length >= 2;

  return (
    <div className="min-h-screen bg-secondary-50 max-w-[1400px] mx-auto flex flex-col">
      {/* ── Lazy spec hydrator ── */}
      <CompareDataBridge catalogue={catalogue} />

      {/* ── Sticky compare bar ── */}
      <CompareBar />

      <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 sm:text-3xl">
              So sánh sản phẩm
            </h1>
            <p className="mt-1 text-sm text-secondary-500">
              Chọn từ 2–4 sản phẩm cùng loại để so sánh chi tiết thông số kỹ thuật
            </p>
          </div>

          {activeCategory && (
            <Badge variant="primary" size="md" dot>
              {CATEGORY_LABELS[activeCategory]}
            </Badge>
          )}
        </div>

        {/* ── Main content ── */}
        <div ref={tableRef}>
          {hasEnough ? (
            <div className="flex flex-col gap-6">
              {/* Section 1 — product cards (owns all card UI/animations) */}
              <CompareHeaderCardList />
              {/* Section 2 — spec data table (name headers + spec rows only) */}
              <CompareTable />
            </div>
          ) : (
            <EmptyCompareState suggestedProducts={suggestedProducts} />
          )}
        </div>
      </main>

      {/* ── Product selection drawer (always mounted) ── */}
      <CompareProductDrawer
        catalogue={catalogue}
        tableRef={tableRef}
      />
    </div>
  );
}
