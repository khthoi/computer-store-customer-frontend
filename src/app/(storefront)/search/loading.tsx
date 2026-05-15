import { Skeleton } from "@/src/components/ui";
import { ProductCardSkeleton } from "@/src/components/product";

export default function SearchLoading() {
  return (
    <div className="py-8 space-y-6">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr] px-4 sm:px-6 lg:px-8">
        <div className="hidden lg:block rounded-xl border border-secondary-200 bg-white p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-44 rounded-md" />
          </div>
          <ProductCardSkeleton itemsPerView={4} />
        </div>
      </div>
    </div>
  );
}
