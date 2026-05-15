import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import type { QuickSuggestionBrand, QuickSuggestionCategory } from "@/src/types/search.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchEmptyStateProps {
  query: string;
  onSearch: (query: string) => void;
  /** Related categories returned by the backend suggestion engine */
  relatedCategories?: QuickSuggestionCategory[];
  /** Related brands returned by the backend suggestion engine */
  relatedBrands?: QuickSuggestionBrand[];
  /** Whether the user has active filters that might be narrowing results */
  hasActiveFilters?: boolean;
  /** Clears all filters and re-runs the current query */
  onClearFilters?: () => void;
  /** Fallback brand list shown when the backend returns no suggestions */
  topBrands?: Array<{ name: string; slug: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchEmptyState({
  query,
  onSearch,
  relatedCategories = [],
  relatedBrands = [],
  hasActiveFilters = false,
  onClearFilters,
  topBrands = [],
}: SearchEmptyStateProps) {
  const hasRelatedCategories = relatedCategories.length > 0;
  const hasRelatedBrands = relatedBrands.length > 0;
  const hasAnySuggestions = hasRelatedCategories || hasRelatedBrands;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-secondary-100">
        <MagnifyingGlassIcon className="h-12 w-12 text-secondary-300" aria-hidden="true" />
      </div>

      {/* Heading */}
      <h2 className="mb-1 text-lg font-semibold text-secondary-700">
        {hasActiveFilters
          ? <>Không tìm thấy kết quả cho <span className="text-secondary-900">&ldquo;{query}&rdquo;</span> với bộ lọc hiện tại</>
          : <>Không tìm thấy kết quả cho <span className="text-secondary-900">&ldquo;{query}&rdquo;</span></>
        }
      </h2>

      {/* Priority 1 — clear filters CTA */}
      {hasActiveFilters && onClearFilters && (
        <div className="mb-6 mt-4">
          <Button variant="primary" size="md" onClick={onClearFilters}>
            Thử lại không có bộ lọc
          </Button>
          <p className="mt-2 text-xs text-secondary-400">Bộ lọc hiện tại có thể đang thu hẹp kết quả quá mức</p>
        </div>
      )}

      {/* Generic tips — only show when there's no better suggestion */}
      {!hasActiveFilters && !hasAnySuggestions && (
        <ul className="mb-6 mt-3 space-y-1.5 text-left text-sm text-secondary-500">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-secondary-400" aria-hidden="true">•</span>
            Kiểm tra lại chính tả của từ khoá.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-secondary-400" aria-hidden="true">•</span>
            Thử dùng từ khoá ngắn hơn hoặc chung hơn.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-secondary-400" aria-hidden="true">•</span>
            Tìm theo tên danh mục hoặc thương hiệu.
          </li>
        </ul>
      )}

      {/* Priority 2 — related categories from backend */}
      {hasRelatedCategories && (
        <div className="mb-6 mt-4 w-full max-w-md">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Danh mục liên quan
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {relatedCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${encodeURIComponent(cat.slug)}`}
                className="flex items-center gap-1.5 rounded-full border border-secondary-200 bg-white px-3.5 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {cat.iconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.iconUrl} alt="" className="h-4 w-4 object-contain" />
                )}
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Priority 3 — related brands from backend */}
      {hasRelatedBrands && (
        <div className="mb-6 w-full max-w-md">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Thương hiệu liên quan
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {relatedBrands.map((brand) => (
              <button
                key={brand.id}
                type="button"
                onClick={() => onSearch(brand.name)}
                className="flex items-center gap-1.5 rounded-full border border-secondary-200 bg-white px-3.5 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {brand.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logoUrl} alt="" className="h-4 w-4 object-contain" />
                )}
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Priority 4 — fallback: top brands from the full catalogue */}
      {!hasAnySuggestions && topBrands.length > 0 && (
        <div className="mb-8 w-full max-w-md">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Khám phá theo thương hiệu
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {topBrands.map((brand) => (
              <button
                key={brand.slug}
                type="button"
                onClick={() => onSearch(brand.name)}
                className="rounded-full border border-secondary-200 bg-white px-4 py-1.5 text-sm text-secondary-700 transition-colors hover:border-primary-400 hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                {brand.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-2">
        <Link href="/">
          <Button variant={hasActiveFilters ? "outline" : "primary"} size="lg">
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
