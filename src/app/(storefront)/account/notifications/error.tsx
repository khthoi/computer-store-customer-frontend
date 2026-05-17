"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-error-200 bg-error-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-error-700">
        Không thể tải thông báo. Vui lòng thử lại.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-700"
      >
        Thử lại
      </button>
    </div>
  );
}
