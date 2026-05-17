import { Skeleton } from "@/src/components/ui/Skeleton";

export default function ForgotPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton variant="text" className="h-8 w-44" />
          <Skeleton variant="text" className="h-4 w-72" />
          <Skeleton variant="text" className="h-4 w-60" />
        </div>
        <div className="space-y-1.5">
          <Skeleton variant="text" className="h-4 w-12" />
          <Skeleton variant="rect" className="h-10 w-full rounded" />
        </div>
        <Skeleton variant="rect" className="mt-2 h-12 w-full rounded-lg" />
        <Skeleton variant="text" className="mx-auto h-4 w-40" />
      </div>
    </div>
  );
}
