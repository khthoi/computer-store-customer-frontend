"use client";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function FaqError({ reset }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Câu hỏi thường gặp</h1>

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h2 className="font-semibold text-red-800 mb-2">Không tải được dữ liệu FAQ</h2>
        <p className="text-red-700 text-sm mb-4">
          Đã có sự cố khi tải danh sách câu hỏi. Vui lòng thử lại sau ít phút.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
