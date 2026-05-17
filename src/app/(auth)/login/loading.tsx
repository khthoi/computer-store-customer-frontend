import { Skeleton } from "@/src/components/ui/Skeleton";

export function LoginSkeleton() {
  return (
    <div className="w-full max-w-md space-y-5">
      {/* Title */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <Skeleton variant="text" className="h-8 w-40" />
        <Skeleton variant="text" className="h-4 w-64" />
      </div>

      {/* Email field */}
      <div className="space-y-1.5">
        <Skeleton variant="text" className="h-4 w-12" />
        <Skeleton variant="rect" className="h-10 w-full rounded" />
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <Skeleton variant="text" className="h-4 w-20" />
        <Skeleton variant="rect" className="h-10 w-full rounded" />
      </div>

      {/* Remember me row */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-4 w-36" />
        <Skeleton variant="text" className="h-4 w-28" />
      </div>

      {/* Submit */}
      <Skeleton variant="rect" className="h-12 w-full rounded-lg" />

      {/* Divider */}
      <Skeleton variant="text" className="mx-auto h-4 w-48" />

      {/* OAuth buttons */}
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rect" className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <LoginSkeleton />
    </div>
  );
}
