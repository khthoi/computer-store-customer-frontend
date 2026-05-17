// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductCardSkeletonProps {
  /**
   * Number of skeleton cards to render.
   * Defaults to `itemsPerView` when that prop is set, otherwise 1.
   */
  count?: number;
  className?: string;
  /**
   * Items visible per row at the widest breakpoint (2xl ≥ 1536 px).
   * When set, renders a responsive grid wrapper automatically.
   * Breakpoint ladder: mobile→2 · sm→3 · lg→4 · xl→5 · 2xl→itemsPerView
   * Default: 6
   */
  itemsPerView?: 4 | 5 | 6;
}

// ─── Grid class lookup ────────────────────────────────────────────────────────
// Static strings required — Tailwind cannot detect dynamic class construction.

const GRID_CLASSES: Record<4 | 5 | 6, string> = {
  4: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
};

// ─── Shimmer primitive ────────────────────────────────────────────────────────

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={["rounded bg-secondary-200 animate-pulse", className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}

// ─── Single skeleton card ─────────────────────────────────────────────────────

function SingleSkeleton() {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border border-secondary-200 bg-white"
      aria-hidden="true"
    >
      {/* Thumbnail */}
      <Shimmer className="aspect-square w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Brand badge */}
        <Shimmer className="h-4 w-14 rounded" />

        {/* Product name — two lines */}
        <div className="flex flex-col gap-1.5">
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-3/4" />
        </div>

        {/* Description */}
        <Shimmer className="h-3 w-2/3" />

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Shimmer className="h-3 w-20" />
          <Shimmer className="h-3 w-8" />
        </div>

        {/* Price */}
        <div className="flex flex-col gap-1 mt-auto">
          <Shimmer className="h-5 w-28" />
          <Shimmer className="h-3 w-20" />
        </div>

        {/* Stock badge */}
        <Shimmer className="h-4 w-16 rounded-full" />

        {/* Action row — two icon buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-secondary-100 mt-1">
          <Shimmer className="h-9 w-9 rounded-lg" />
          <Shimmer className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductCardSkeleton — loading placeholder matching the ProductCard layout.
 *
 * ```tsx
 * // Standalone single placeholder
 * <ProductCardSkeleton />
 *
 * // Self-contained responsive grid (no outer wrapper needed)
 * <ProductCardSkeleton itemsPerView={6} />
 *
 * // Legacy: fragments inside a caller-provided grid
 * <div className="grid grid-cols-5 gap-3">
 *   <ProductCardSkeleton count={5} />
 * </div>
 * ```
 */
export function ProductCardSkeleton({
  count,
  className = "",
  itemsPerView,
}: ProductCardSkeletonProps) {
  const resolvedCount = count ?? itemsPerView ?? 1;

  const cards = Array.from({ length: resolvedCount }, (_, i) => (
    <div
      key={i}
      role="status"
      aria-busy="true"
      aria-label="Loading product"
      className={className}
    >
      <SingleSkeleton />
      <span className="sr-only">Đang tải…</span>
    </div>
  ));

  if (itemsPerView) {
    return <div className={GRID_CLASSES[itemsPerView]}>{cards}</div>;
  }

  return <>{cards}</>;
}
