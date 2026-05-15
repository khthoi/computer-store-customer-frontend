"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[/products] render error", error);
  }, [error]);

  return (
    <div className="py-20 flex flex-col items-center justify-center text-center">
      <h2 className="text-lg font-semibold text-secondary-900 mb-2">
        Đã xảy ra lỗi khi tải danh sách sản phẩm
      </h2>
      <p className="text-sm text-secondary-500 mb-4 max-w-md">
        Vui lòng kiểm tra kết nối hoặc thử lại sau ít phút.
      </p>
      <Button onClick={() => reset()}>Thử lại</Button>
    </div>
  );
}
