"use client";

import Image from "next/image";
import { CheckIcon } from "@heroicons/react/24/solid";
import type { StorefrontBrand } from "@/src/services/storefront-catalog-meta.service";

export function BrandRailVisualization({
  brands,
  selected = [],
  onToggle,
}: {
  brands: StorefrontBrand[];
  /** Slugs of brands currently selected as filters */
  selected?: string[];
  /** Called when a brand chip is clicked; consumer toggles in/out of filter list */
  onToggle: (brandSlug: string) => void;
}) {
  const visible = brands.filter((b) => !!b.logo);
  if (!visible.length) return null;

  const selectedSet = new Set(selected);

  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-secondary-800">
          Mua theo thương hiệu
        </div>
        {selectedSet.size > 0 && (
          <span className="text-xs text-secondary-500">
            Đã chọn {selectedSet.size} thương hiệu
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {visible.map((b) => {
          const isSelected = selectedSet.has(b.slug);
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(b.slug)}
              className={[
                "relative flex shrink-0 min-w-[96px] flex-col items-center gap-2 rounded-lg border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                isSelected
                  ? "border-primary-500 bg-primary-50 ring-1 ring-primary-300"
                  : "border-secondary-200 bg-white hover:border-primary-300 hover:bg-primary-50/50",
              ].join(" ")}
            >
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute right-1.5 top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm"
                >
                  <CheckIcon className="h-3 w-3" />
                </span>
              )}
              <div className="relative h-10 w-20">
                <Image
                  src={b.logo as string}
                  alt={b.name}
                  fill
                  sizes="80px"
                  className="object-contain"
                />
              </div>
              <span
                className={[
                  "max-w-[96px] truncate text-xs font-medium",
                  isSelected ? "text-primary-700" : "text-secondary-700",
                ].join(" ")}
              >
                {b.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
