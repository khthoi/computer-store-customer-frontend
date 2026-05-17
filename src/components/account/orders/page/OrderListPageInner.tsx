"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/src/components/ui/Input";
import { Tabs } from "@/src/components/ui/Tabs";
import { ToastMessage } from "@/src/components/ui/Toast";
import { Button } from "@/src/components/ui/Button";
import { OrderCard } from "@/src/components/account/orders/list/OrderCard";
import {
  ORDERS_PER_PAGE,
  type OrderSummary,
  type OrderStatus,
} from "@/src/types/account-order.types";
import { MagnifyingGlassIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

// ─── Tab config ───────────────────────────────────────────────────────────────

type FilterTab =
  | "all"
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled"
  | "return";

/** Which order statuses each tab shows. Empty array = always empty (e.g. return). */
const TAB_STATUSES: Record<FilterTab, OrderStatus[]> = {
  all:       [],
  pending:   ["pending"],
  confirmed: ["confirmed", "preparing"],
  shipping:  ["shipping"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
  return:    [],
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrderListPageInnerProps {
  initialOrders: OrderSummary[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * OrderListPageInner — client root for /account/orders.
 *
 * State:
 * - orders       : mutable local copy (for optimistic cancel)
 * - activeTab    : currently selected filter tab
 * - search       : search query string
 * - page         : how many pages of ORDERS_PER_PAGE have been loaded
 * - toast        : visibility + message for the cancel-success toast
 */
export function OrderListPageInner({ initialOrders }: OrderListPageInnerProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });

  // ── Filtering pipeline ─────────────────────────────────────────────────────

  const statusFiltered = useMemo<OrderSummary[]>(() => {
    if (activeTab === "all") return orders;
    if (activeTab === "return") return [];
    const allowed = TAB_STATUSES[activeTab];
    return orders.filter((o) => allowed.includes(o.status));
  }, [orders, activeTab]);

  const searchFiltered = useMemo<OrderSummary[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return statusFiltered;
    return statusFiltered.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.items.some((item) => item.name.toLowerCase().includes(q))
    );
  }, [statusFiltered, search]);

  const paginated = useMemo<OrderSummary[]>(
    () => searchFiltered.slice(0, page * ORDERS_PER_PAGE),
    [searchFiltered, page]
  );

  const hasMore = paginated.length < searchFiltered.length;

  // ── Tab badge counts (always from full orders list, not post-search) ────────

  const tabCounts = useMemo(() => {
    const count = (tab: FilterTab) => {
      if (tab === "all") return orders.length;
      if (tab === "return") return 0;
      const allowed = TAB_STATUSES[tab];
      return orders.filter((o) => allowed.includes(o.status)).length;
    };
    return {
      all:       count("all"),
      pending:   count("pending"),
      confirmed: count("confirmed"),
      shipping:  count("shipping"),
      delivered: count("delivered"),
      cancelled: count("cancelled"),
      return:    count("return"),
    };
  }, [orders]);

  const tabItems = useMemo(
    () => [
      {
        value: "all",
        label: (
          <span className="flex items-center gap-1.5">
            Tất cả
            <TabBadge count={tabCounts.all} />
          </span>
        ),
      },
      {
        value: "pending",
        label: (
          <span className="flex items-center gap-1.5">
            Chờ xác nhận
            <TabBadge count={tabCounts.pending} />
          </span>
        ),
      },
      {
        value: "confirmed",
        label: (
          <span className="flex items-center gap-1.5">
            Đang xử lý
            <TabBadge count={tabCounts.confirmed} />
          </span>
        ),
      },
      {
        value: "shipping",
        label: (
          <span className="flex items-center gap-1.5">
            Đang giao
            <TabBadge count={tabCounts.shipping} />
          </span>
        ),
      },
      {
        value: "delivered",
        label: (
          <span className="flex items-center gap-1.5">
            Đã giao
            <TabBadge count={tabCounts.delivered} />
          </span>
        ),
      },
      {
        value: "cancelled",
        label: (
          <span className="flex items-center gap-1.5">
            Đã hủy
            <TabBadge count={tabCounts.cancelled} />
          </span>
        ),
      },
      {
        value: "return",
        label: (
          <span className="flex items-center gap-1.5">
            Đổi/Trả
            <TabBadge count={tabCounts.return} />
          </span>
        ),
      },
    ],
    [tabCounts]
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as FilterTab);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    []
  );

  const handleCancelSuccess = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled" as const } : o))
    );
    setToast({ visible: true, message: `Đơn hàng ${id} đã được hủy thành công.` });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      {/* Page header */}
      <div className="border-b border-secondary-100 px-6 py-5">
        <h1 className="text-lg font-bold text-secondary-900">Đơn hàng của tôi</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-100 px-2 overflow-x-auto">
        <Tabs
          tabs={tabItems}
          value={activeTab}
          onChange={handleTabChange}
          variant="line"
        >{null}</Tabs>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-secondary-100">
        <Input
          placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm…"
          value={search}
          onChange={handleSearchChange}
          prefixIcon={<MagnifyingGlassIcon className="h-4 w-4 text-secondary-400" />}
          fullWidth
        />
      </div>

      {/* Order list */}
      <div className="px-6 py-5 space-y-4">
        {paginated.length === 0 ? (
          <EmptyState hasSearch={search.trim().length > 0} />
        ) : (
          <>
            {paginated.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancelSuccess={handleCancelSuccess}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Xem thêm đơn hàng
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel-success toast */}
      <ToastMessage
        isVisible={toast.visible}
        type="success"
        message={toast.message}
        position="bottom-right"
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="rounded-full bg-secondary-100 px-1.5 py-0.5 text-[11px] font-semibold text-secondary-600 leading-none">
      {count}
    </span>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <ClipboardDocumentListIcon className="h-12 w-12 text-secondary-300" />
      <p className="text-base font-semibold text-secondary-700">
        {hasSearch ? "Không tìm thấy đơn hàng" : "Chưa có đơn hàng nào"}
      </p>
      <p className="text-sm text-secondary-400">
        {hasSearch
          ? "Thử tìm kiếm với từ khóa khác."
          : "Các đơn hàng bạn đặt sẽ xuất hiện tại đây."}
      </p>
    </div>
  );
}
