"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import { useNotifications } from "@/src/hooks/useNotifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/src/services/notification.service";
import { formatRelativeVi } from "@/src/lib/format";
import type { CustomerNotification } from "@/src/types/notification.types";

/**
 * Derives the destination URL for a notification when a customer clicks it.
 * Falls back to the notifications listing page when no entity is attached.
 */
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
  return "/account/notifications";
}

export function NotificationBell() {
  const router = useRouter();
  const { items, unreadCount, hasMore, loading, loadingMore, loadMore, resetPreview } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset to preview size whenever the dropdown closes
  useEffect(() => {
    if (!open) resetPreview();
  }, [open, resetPreview]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleItemClick(n: CustomerNotification) {
    setOpen(false);
    const href = deriveHref(n);
    if (!n.isRead) {
      setBusyId(n.id);
      try {
        await markNotificationRead(n.id);
      } catch {
        // Ignore — navigation should still proceed.
      } finally {
        setBusyId(null);
      }
    }
    router.push(href);
  }

  async function handleMarkAll() {
    if (unreadCount === 0) return;
    try {
      await markAllNotificationsRead();
    } catch {
      // Silent — refetch on next poll will reconcile.
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Thông báo"
        onClick={() => setOpen((value) => !value)}
        className="flex flex-col items-center gap-0.5 text-secondary-500 transition-colors hover:text-primary-600 cursor-pointer"
      >
        <div className="relative">
          {open ? (
            <BellIconSolid className="h-5 w-5 text-primary-600" />
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 flex h-4 min-w-[16px] -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-error-500 px-1 text-[9px] font-bold text-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium leading-none">Thông báo</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 sm:w-96 rounded-lg border border-secondary-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-secondary-100 px-4 py-3">
            <p className="text-sm font-semibold text-secondary-900">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600">
                  {unreadCount} chưa đọc
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:text-secondary-300"
            >
              Đánh dấu đã đọc tất cả
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-secondary-400">
                Đang tải…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-secondary-500">
                Chưa có thông báo nào.
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
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        n.isRead
                          ? "hover:bg-secondary-50"
                          : "bg-primary-50/40 hover:bg-primary-50",
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
                        <p
                          className={[
                            "truncate text-sm",
                            n.isRead
                              ? "font-medium text-secondary-700"
                              : "font-semibold text-secondary-900",
                          ].join(" ")}
                        >
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-secondary-500">
                          {n.content}
                        </p>
                        <p className="mt-1 text-[11px] text-secondary-400">
                          {formatRelativeVi(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Load more (inside scrollable area, after the list) */}
            {hasMore && items.length > 0 && (
              <div className="border-t border-secondary-100 px-4 py-2 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 disabled:cursor-not-allowed disabled:text-secondary-400"
                >
                  {loadingMore ? "Đang tải…" : "Xem thêm"}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-secondary-100 px-4 py-2 text-center">
            <Link
              href="/account/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
