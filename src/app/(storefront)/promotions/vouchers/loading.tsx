export default function Loading() {
  return (
    <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="h-10 w-72 rounded-lg bg-secondary-100 animate-pulse" />
      <div className="h-8 w-48 rounded-lg bg-secondary-100 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-56 rounded-2xl bg-secondary-100 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
