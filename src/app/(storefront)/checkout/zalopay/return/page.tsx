"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function ZaloPayReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "failed">(
    "pending",
  );

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const orderRef = searchParams.get("orderId") ?? "";
    if (statusParam === "1") {
      setStatus("success");
      const timer = setTimeout(() => {
        router.push(orderRef ? `/checkout/success?orderId=${orderRef}` : "/account/orders");
      }, 2000);
      return () => clearTimeout(timer);
    }
    setStatus("failed");
  }, [searchParams, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {status === "pending" && (
        <p className="text-secondary-500">Đang xử lý kết quả thanh toán...</p>
      )}
      {status === "success" && (
        <>
          <CheckCircleIcon className="mx-auto h-16 w-16 text-success-600" />
          <h1 className="mt-4 text-xl font-bold text-secondary-900">
            Thanh toán ZaloPay thành công
          </h1>
          <p className="mt-2 text-sm text-secondary-600">
            Đơn hàng của bạn đã được ghi nhận thanh toán. Đang chuyển hướng...
          </p>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircleIcon className="mx-auto h-16 w-16 text-error-600" />
          <h1 className="mt-4 text-xl font-bold text-secondary-900">
            Thanh toán không thành công
          </h1>
          <p className="mt-2 text-sm text-secondary-600">
            Giao dịch đã bị huỷ hoặc gặp lỗi. Vui lòng thử lại từ trang đơn hàng.
          </p>
          <button
            type="button"
            onClick={() => router.push("/account/orders")}
            className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Xem đơn hàng
          </button>
        </>
      )}
    </div>
  );
}
