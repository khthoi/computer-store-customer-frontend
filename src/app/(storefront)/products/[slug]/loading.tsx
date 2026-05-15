import { Skeleton } from "@/src/components/ui/Skeleton";

// ─── Skeleton Loading Screen ───────────────────────────────────────────────────
// Mirrors the exact layout of page.tsx to prevent layout shift on hydration.

export default function ProductDetailLoading() {
  return (
    <main className="min-h-screen bg-secondary-50 pb-24 lg:pb-0">
      {/* ── Hero section skeleton ── */}
      <section className="bg-white border-b border-secondary-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-5">
            <Skeleton className="h-4 w-64 rounded" />
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* LEFT: Image gallery */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Main image */}
              <Skeleton className="w-full h-[480px] rounded-xl" />
              {/* Thumbnail strip */}
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-16 h-16 rounded-xl shrink-0" />
                ))}
              </div>
            </div>

            {/* RIGHT: Product info */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Stock badge */}
              <Skeleton className="h-6 w-28 rounded-full" />

              {/* Brand */}
              <Skeleton className="h-5 w-16 rounded" />

              {/* Product name (2 lines) */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-4/5 rounded" />
              </div>

              {/* SKU + rating row */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-5 w-32 rounded" />
              </div>

              {/* Price block */}
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-8 w-48 rounded" />
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-52 rounded" />
              </div>

              {/* Variant selectors */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-20 rounded-md" />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-36 rounded" />
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-20 rounded-md" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantity stepper */}
              <Skeleton className="h-10 w-36 rounded-lg" />

              {/* CTA buttons */}
              <div className="flex flex-col gap-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              {/* Wishlist + share */}
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>

              {/* Trust badges */}
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs skeleton ── */}
      <section className="bg-white mt-4">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab bar */}
          <div className="border-b border-secondary-200 py-3">
            <div className="flex gap-6 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-32 rounded shrink-0" />
              ))}
            </div>
          </div>
          {/* Tab content */}
          <div className="py-8">
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </section>

      {/* ── Related products skeleton ── */}
      <section className="py-10 bg-secondary-50 border-t border-secondary-200">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-48 rounded mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
