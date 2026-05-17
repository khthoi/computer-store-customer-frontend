"use client";

import { useRef } from "react";
import { Badge } from "@/src/components/ui/Badge";
import { CompareBar } from "@/src/components/compare-ui/header/CompareBar";
import { CompareHeaderCardList } from "@/src/components/compare-ui/header/CompareHeaderCardList";
import { CompareTable } from "@/src/components/compare-ui/table/CompareTable";
import { CompareProductDrawer } from "@/src/components/compare-ui/drawer/CompareProductDrawer";
import { CompareDataBridge } from "@/src/components/compare-ui/state/CompareDataBridge";
import { EmptyCompareState } from "@/src/components/compare-ui/state/EmptyCompareState";
import { useCompare } from "@/src/store/compare.store";
import type { CatalogueProduct } from "@/src/components/compare-ui/types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComparePageClientProps {
  catalogue: CatalogueProduct[];
  popularProducts: StorefrontProductCardDto[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComparePageClient({
  catalogue,
  popularProducts,
}: ComparePageClientProps) {
  const { state } = useCompare();
  const { compareList } = state;
  const activeCategoryLabel = compareList[0]?.rootCategoryName ?? null;
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

          {activeCategoryLabel && (
            <Badge variant="primary" size="md" dot>
              {activeCategoryLabel}
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
            <EmptyCompareState popularProducts={popularProducts} />
          )}
        </div>
      </main>

      {/* ── Product selection drawer (always mounted) ── */}
      <CompareProductDrawer tableRef={tableRef} />
    </div>
  );
}
