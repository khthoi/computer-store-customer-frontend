"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { formatVND } from "@/src/lib/format";
import type { OrderSummary } from "@/src/types/account-order.types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface Props {
  order: OrderSummary;
}

export function OrderSnapshot({ order }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-secondary-200 bg-secondary-50">
      <div className="flex items-center justify-between gap-3 border-b border-secondary-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-sm font-semibold text-secondary-900">
            {order.id}
          </span>
          <span className="text-xs text-secondary-400">·</span>
          <span className="text-xs text-secondary-500">
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
        <Link
          href={`/account/orders/${order.numericId}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-secondary-500 hover:text-secondary-700"
        >
          Mở đơn hàng
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="divide-y divide-secondary-200/60">
        {order.items.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-secondary-200 bg-white">
              <Image
                src={item.thumbnailSrc}
                alt={item.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm text-secondary-800">
                {item.name}
              </p>
              <p className="line-clamp-1 text-xs text-secondary-400">
                {item.variantLabel || "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-secondary-800">
                {formatVND(item.unitPrice)}
              </p>
              <p className="text-xs text-secondary-400">×{item.quantity}</p>
            </div>
          </li>
        ))}
        {order.items.length > 4 && (
          <li className="px-4 py-2 text-xs text-secondary-400">
            … và {order.items.length - 4} sản phẩm khác
          </li>
        )}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-secondary-200 bg-white px-4 py-2.5">
        <div className="flex flex-col text-xs text-secondary-500">
          <span>Đặt ngày {formatDate(order.placedAt)}</span>
          {order.deliveredAt && (
            <span>Giao ngày {formatDate(order.deliveredAt)}</span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-secondary-400">Tổng đơn</p>
          <p className="text-sm font-semibold text-secondary-900">
            {formatVND(order.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
