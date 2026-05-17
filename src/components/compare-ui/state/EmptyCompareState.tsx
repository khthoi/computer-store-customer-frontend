"use client";

import { ArrowsRightLeftIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { ProductCarousel } from "@/src/components/product/card/ProductCarousel";
import { useCompare } from "@/src/store/compare.store";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmptyCompareStateProps {
  /**
   * Popular product DTOs ranked by review-count → average-rating → newest
   * (resolved server-side via `sort=popular`). Rendered inside a 6-item
   * ProductCarousel so users can quickly add a popular item to compare.
   */
  popularProducts?: StorefrontProductCardDto[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmptyCompareState({
  popularProducts = [],
}: EmptyCompareStateProps) {
  const { openDrawer, clearAll, state } = useCompare();
  const singleton = state.compareList.length === 1 ? state.compareList[0] : null;

  return (
    <div className="flex flex-col items-center py-16 px-4">
      {/* Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary-100">
        <ArrowsRightLeftIcon
          className="h-12 w-12 text-secondary-300"
          aria-hidden="true"
        />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-secondary-500">
        {singleton
          ? "Cần thêm 1 sản phẩm nữa để bắt đầu so sánh"
          : "Chưa có sản phẩm để so sánh"}
      </h2>
      <p className="mb-8 max-w-md text-center text-sm text-secondary-400">
        {singleton ? (
          <>
            Danh sách đang có{" "}
            <span className="font-medium text-secondary-600">
              {singleton.name}
            </span>
            {singleton.rootCategoryName ? (
              <>
                {" "}
                (danh mục{" "}
                <span className="font-medium text-secondary-600">
                  {singleton.rootCategoryName}
                </span>
                )
              </>
            ) : null}
            . Thêm thêm 1 sản phẩm cùng danh mục, hoặc xóa danh sách để bắt đầu lại.
          </>
        ) : (
          <>Thêm ít nhất 2 sản phẩm cùng loại để bắt đầu so sánh thông số kỹ thuật.</>
        )}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={openDrawer}
          leftIcon={<PlusIcon className="h-5 w-5" aria-hidden="true" />}
        >
          {singleton ? "Thêm sản phẩm" : "Chọn sản phẩm"}
        </Button>
        {singleton && (
          <Button
            variant="ghost"
            size="md"
            onClick={clearAll}
            leftIcon={<TrashIcon className="h-5 w-5" aria-hidden="true" />}
          >
            Xóa danh sách
          </Button>
        )}
      </div>

      {/* ── Popular products carousel ── */}
      {popularProducts.length > 0 && (
        <section
          aria-labelledby="compare-popular-heading"
          className="mt-16 w-full"
        >
          <h3
            id="compare-popular-heading"
            className="mb-4 text-base font-semibold text-secondary-700"
          >
            Gợi ý sản phẩm phổ biến
          </h3>
          <ProductCarousel
            products={[]}
            dtos={popularProducts}
            itemsPerView={6}
          />
        </section>
      )}
    </div>
  );
}
