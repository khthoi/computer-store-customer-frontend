import { Skeleton } from "@/src/components/ui/Skeleton";

export function RegisterSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Skeleton variant="text" className="h-8 w-44" />
        <Skeleton variant="text" className="h-4 w-72" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="rect" className="h-10 w-full rounded" />
        </div>
      ))}
      <Skeleton variant="rect" className="mt-2 h-12 w-full rounded-lg" />
      <Skeleton variant="text" className="mx-auto h-4 w-48" />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function RegisterLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <RegisterSkeleton />
    </div>
  );
}
