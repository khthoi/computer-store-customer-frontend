import { Skeleton } from "@/src/components/ui/Skeleton";

export default function ContactLoading() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton variant="text" className="h-4 w-20 mb-2" />
          <Skeleton variant="text" className="h-9 w-80 mb-2" />
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col items-center gap-2">
              <Skeleton variant="rect" className="h-8 w-8 rounded" />
              <Skeleton variant="text" className="h-4 w-20" />
              <Skeleton variant="text" className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Form + Offices */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-8 space-y-5">
            <Skeleton variant="text" className="h-6 w-40 mb-4" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rect" className="h-12 w-full rounded-lg" />
            ))}
            <Skeleton variant="rect" className="h-32 w-full rounded-lg" />
            <Skeleton variant="rect" className="h-12 w-full rounded-lg" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            <Skeleton variant="text" className="h-6 w-48 mb-2" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
                <Skeleton variant="text" className="h-5 w-48" />
                <Skeleton variant="text" className="h-4 w-full" />
                <Skeleton variant="text" className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
