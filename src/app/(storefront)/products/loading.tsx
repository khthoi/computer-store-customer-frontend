import { Skeleton } from "@/src/components/ui";
import { ProductCardSkeleton } from "@/src/components/product";

export default function ProductsLoading() {
  return (
    <div className="py-6 space-y-5">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-8 w-48" />

      <div className="hidden lg:block rounded-xl border border-secondary-200 bg-white p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3">
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      <ProductCardSkeleton itemsPerView={4} />
    </div>
  );
}
