"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { ReturnStatusBadge } from "@/src/components/account/returns/ReturnStatusBadge";
import type { ReturnRequest } from "@/src/types/account-return.types";
import type { OrderSummary } from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReturnRequestSummaryCardProps {
  request: ReturnRequest;
  order: OrderSummary | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReturnRequestSummaryCard({
  request,
  order,
}: ReturnRequestSummaryCardProps) {
  // Resolve thumbnails for items involved in this return request
  const involvedItems = request.items
    .map((ri) => order?.items.find((oi) => oi.id === ri.itemId))
    .filter(Boolean) as NonNullable<typeof order>["items"];

  const visibleItems = involvedItems.slice(0, 3);
  const extraCount = involvedItems.length - visibleItems.length;

  return (
    <article className="rounded-xl border border-secondary-200 bg-white overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary-100 bg-secondary-50 px-4 py-3">
        <span className="font-mono text-sm font-semibold text-secondary-900">
          {request.id}
        </span>
        <ReturnStatusBadge status={request.status} />
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 space-y-3">
        {/* Order ID + submitted date */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500">
          <span>
            Đơn hàng:{" "}
            {order ? (
              <Tooltip content="Xem chi tiết đơn hàng" placement="top">
                <a
                  href={`/account/orders/${order.id}`}
                  className="font-medium text-secondary-700 hover:text-primary-600 hover:underline underline-offset-2 transition-colors duration-150"
                >
                  {request.orderId}
                </a>
              </Tooltip>
            ) : (
              <span className="font-medium text-secondary-700">
                {request.orderId}
              </span>
            )}
          </span>
          <span className="text-secondary-300">·</span>
          <span>Gửi ngày {formatDate(request.submittedAt)}</span>
        </div>

        {/* Item thumbnails */}
        {visibleItems.length > 0 && (
          <div className="flex items-center gap-2">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-secondary-100 bg-secondary-50"
              >
                <Image
                  src={item.thumbnailSrc}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-contain p-1"
                />
              </div>
            ))}
            {extraCount > 0 && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-secondary-200 bg-secondary-50 text-xs font-medium text-secondary-500">
                +{extraCount}
              </div>
            )}
          </div>
        )}

        {/* First product name summary */}
        {involvedItems.length > 0 && (
          <p className="text-sm text-secondary-600 line-clamp-1">
            {involvedItems[0].name}
            {involvedItems.length > 1 &&
              ` và ${involvedItems.length - 1} sản phẩm khác`}
          </p>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="border-t border-secondary-100 px-4 py-3">
        <Link
          href={`/account/returns/${request.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          Xem chi tiết
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
