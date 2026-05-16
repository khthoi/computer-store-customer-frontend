"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Pagination } from "@/src/components/navigation/Pagination";
import { CreateTicketModal } from "./CreateTicketModal";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_BADGE,
  TICKET_PRIORITY_LABELS,
  type SupportTicket,
} from "@/src/types/account-support.types";
import type { OrderSummary } from "@/src/types/account-order.types";

interface Props {
  tickets: SupportTicket[];
  page: number;
  totalPages: number;
  orders: OrderSummary[];
  totalOrders?: number;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportPageInner({ tickets, page, totalPages, orders, totalOrders }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-secondary-900">
          Yêu cầu hỗ trợ
        </h1>
        <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
          Mở yêu cầu mới
        </Button>
      </div>

      {tickets.length === 0 ? (
        <p className="py-10 text-center text-sm text-secondary-400">
          Bạn chưa có yêu cầu hỗ trợ nào.
        </p>
      ) : (
        <ul className="divide-y divide-secondary-100">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/account/support/${t.numericId}`}
                className="block rounded px-3 py-3 hover:bg-secondary-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="line-clamp-1 text-sm font-semibold text-secondary-900">
                    {t.subject}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={TICKET_PRIORITY_BADGE[t.priority]} dot>
                      {TICKET_PRIORITY_LABELS[t.priority]}
                    </Badge>
                    <Badge
                      variant={t.status === "in_progress" ? "warning" : "success"}
                    >
                      {t.status === "in_progress" ? "Đang xử lý" : "Đã giải quyết"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-secondary-400">
                  {TICKET_CATEGORY_LABELS[t.category]} · #{t.id} ·{" "}
                  {formatDateTime(t.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            size="sm"
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      <CreateTicketModal
        isOpen={open}
        onClose={() => setOpen(false)}
        orders={orders}
        totalOrders={totalOrders}
        onCreated={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
