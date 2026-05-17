import { Skeleton } from "@/src/components/ui/Skeleton";

export default function FaqLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton variant="text" className="h-9 w-64 mb-2" />
      <Skeleton variant="text" className="h-4 w-48 mb-10" />

      {/* Sections */}
      {Array.from({ length: 4 }).map((_, s) => (
        <div key={s} className="mb-8">
          <Skeleton variant="text" className="h-6 w-56 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
