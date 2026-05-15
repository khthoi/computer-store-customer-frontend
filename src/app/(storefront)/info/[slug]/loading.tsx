export default function Loading() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-8 w-2/3 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 space-y-3">
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-11/12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-10/12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-9/12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-11/12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-8/12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-10/12 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}
