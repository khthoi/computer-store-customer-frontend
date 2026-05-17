"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import { Tabs } from "@/src/components/ui/Tabs";
import { Spinner } from "@/src/components/ui/Spinner";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/services/notification.service";
import { formatRelativeVi } from "@/src/lib/format";
import type {
  CustomerNotification,
  NotificationsResult,
} from "@/src/types/notification.types";

const PAGE_SIZE = 20;

type FilterTab = "all" | "unread";

interface NotificationsPageInnerProps {
  initialData: NotificationsResult;
}

function deriveHref(n: CustomerNotification): string {
  if (n.relatedEntity === "DonHang" && n.relatedEntityId) {
    return `/account/orders/${n.relatedEntityId}`;
  }
  if (n.relatedEntity === "HoanHang" && n.relatedEntityId) {
    return `/account/returns/${n.relatedEntityId}`;
  }
  if (n.relatedEntity === "KhuyenMai") {
    return "/promotions";
  }
  return "";
}

export function NotificationsPageInner({ initialData }: NotificationsPageInnerProps) {
  const router = useRouter();
  const [items, setItems] = useState<CustomerNotification[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const isFirstRender = useRef(true);
  const prevTabRef = useRef<FilterTab>("all");

  // Reset page when tab changes
  useEffect(() => {
    if (isFirstRender.current) return;
    setPage(1);
  }, [tab]);

  // Fetch on page/tab change (skip very first render — initialData already supplied)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const isTabChange = tab !== prevTabRef.current;
    prevTabRef.current = tab;

    let cancelled = false;
    (async () => {
      if (isTabChange) setLoading(true);
      try {
        const result = await getMyNotifications({
          page,
          limit: PAGE_SIZE,
          unreadOnly: tab === "unread",
        });
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
        setUnreadCount(result.unreadCount);
      } catch {
        // keep existing
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, tab]);

  async function handleItemClick(n: CustomerNotification) {
    const href = deriveHref(n);
    if (!n.isRead) {
      setBusyId(n.id);
      try {
        await markNotificationRead(n.id);
        setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      } finally {
        setBusyId(null);
      }
    }
    if (href) router.push(href);
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnreadCount(0);
      if (tab === "unread") {
        setItems([]);
        setTotal(0);
      }
    } catch {
      // ignore
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-secondary-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-secondary-900">Thông báo</h1>
          <p className="mt-0.5 text-xs text-secondary-500">
            {unreadCount > 0
              ? `Bạn có ${unreadCount} thông báo chưa đọc`
              : "Bạn đã đọc hết tất cả thông báo"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAll}
          disabled={unreadCount === 0}
          className="self-start rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:border-secondary-200 disabled:bg-secondary-50 disabled:text-secondary-400 sm:self-auto"
        >
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-100 px-6 pt-3">
        <Tabs
          tabs={[
            { value: "all", label: "Tất cả" },
            { value: "unread", label: `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          ]}
          value={tab}
          onChange={(val) => setTab(val as FilterTab)}
        >
          <span />
        </Tabs>
      </div>

      {/* List */}
      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
            <Spinner size="md" />
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <BellIcon className="mb-3 h-12 w-12 text-secondary-300" />
            <p className="text-sm font-medium text-secondary-700">
              {tab === "unread"
                ? "Không có thông báo chưa đọc"
                : "Chưa có thông báo nào"}
            </p>
            <p className="mt-1 text-xs text-secondary-400">
              Các cập nhật đơn hàng, khuyến mãi và điểm thưởng sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-secondary-100">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(n)}
                  disabled={busyId === n.id}
                  className={[
                    "flex w-full items-start gap-3 px-6 py-4 text-left transition-colors",
                    n.isRead
                      ? "hover:bg-secondary-50"
                      : "bg-primary-50/30 hover:bg-primary-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.isRead ? "bg-transparent" : "bg-primary-500",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={[
                          "text-sm",
                          n.isRead
                            ? "font-medium text-secondary-700"
                            : "font-semibold text-secondary-900",
                        ].join(" ")}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[11px] text-secondary-400">
                        {formatRelativeVi(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-secondary-500">{n.content}</p>
                    <p className="mt-1.5 text-[11px] uppercase tracking-wide text-secondary-400">
                      Kênh: {n.channel}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-secondary-100 px-6 py-3">
          <p className="text-xs text-secondary-500">
            Trang {page} / {totalPages} ({total} thông báo)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="rounded-md border border-secondary-200 px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-secondary-200 px-3 py-1.5 text-sm font-medium text-secondary-700 transition-colors hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
