"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/outline";
import { Pagination } from "@/src/components/navigation/Pagination";
import { ReturnRequestSummaryCard } from "@/src/components/account/returns/ReturnRequestSummaryCard";
import type { ReturnRequest } from "@/src/types/account-return.types";
import type { OrderSummary } from "@/src/types/account-order.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReturnRequestListProps {
  requests: ReturnRequest[];
  orders: OrderSummary[];
  page?: number;
  totalPages?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReturnRequestList({ requests, orders, page = 1, totalPages = 1 }: ReturnRequestListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-secondary-200 bg-white py-20 px-6 text-center">
        <ArrowUturnLeftIcon
          className="h-12 w-12 text-secondary-300"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-secondary-700">
          Bạn chưa có yêu cầu đổi/trả nào.
        </p>
        <Link
          href="/account/orders"
          className="text-sm text-primary-600 underline underline-offset-2 hover:text-primary-700"
        >
          Xem đơn hàng của bạn
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {requests.map((request) => {
          const order = orders.find((o) => o.id === request.orderId);
          return (
            <li key={request.id}>
              <ReturnRequestSummaryCard request={request} order={order} />
            </li>
          );
        })}
      </ul>
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination
            size="sm"
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
    </div>
  );
}
