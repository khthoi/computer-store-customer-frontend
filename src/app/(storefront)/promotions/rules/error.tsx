"use client";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-secondary-900">
        Không tải được trang quy tắc đổi thưởng
      </h2>
      <p className="mt-2 text-sm text-secondary-500">
        {error.message || "Đã có lỗi xảy ra. Vui lòng thử lại."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Thử lại
      </button>
    </div>
  );
}
