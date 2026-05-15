"use client";

export default function StaticPageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Không tải được nội dung trang
        </h1>
        <p className="text-slate-600 mb-6">
          Đã xảy ra lỗi khi tải nội dung. Vui lòng thử lại sau.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
