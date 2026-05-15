"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Product detail page error:", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">
          Không tải được sản phẩm
        </h1>
        <p className="text-slate-600">
          Đã có lỗi xảy ra khi lấy thông tin sản phẩm. Vui lòng thử lại sau ít phút.
        </p>
        <div className="flex gap-3 justify-center mt-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium"
          >
            Thử lại
          </button>
          <a
            href="/products"
            className="px-4 py-2 rounded-lg border border-secondary-200 text-slate-700 hover:bg-secondary-50 font-medium"
          >
            Quay về danh sách
          </a>
        </div>
      </div>
    </main>
  );
}
