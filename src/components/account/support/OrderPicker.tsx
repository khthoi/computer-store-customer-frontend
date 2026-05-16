"use client";

import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { getMyOrders } from "@/src/services/account-order.service";
import type { OrderSummary } from "@/src/types/account-order.types";

interface Props {
  initialOrders: OrderSummary[];
  selectedOrder: OrderSummary | null;
  onChange: (order: OrderSummary | null) => void;
  /** Tổng số đơn ở BE (để show "tìm thêm" khi cần) */
  totalAvailable?: number;
}

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function OrderPicker({
  initialOrders,
  selectedOrder,
  onChange,
  totalAvailable,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrderSummary[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  // Reset results when initial list changes
  useEffect(() => {
    if (!query) setResults(initialOrders);
  }, [initialOrders, query]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (!trimmed) {
      setResults(initialOrders);
      setLoading(false);
      return;
    }

    setLoading(true);
    const seq = ++requestSeqRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const { items } = await getMyOrders({ q: trimmed, limit: SEARCH_LIMIT });
        if (seq === requestSeqRef.current) {
          setResults(items);
        }
      } catch {
        if (seq === requestSeqRef.current) setResults([]);
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, initialOrders]);

  const handleSelect = (order: OrderSummary) => {
    onChange(order);
    setOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-md border bg-white px-3 py-2 text-left text-sm transition-colors",
          open
            ? "border-primary-400"
            : "border-secondary-200 hover:border-secondary-300",
        ].join(" ")}
      >
        {selectedOrder ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-secondary-900">
              {selectedOrder.id}
            </span>
            <span className="block truncate text-xs text-secondary-400">
              {formatDate(selectedOrder.placedAt)} · {selectedOrder.itemCount}{" "}
              sản phẩm
            </span>
          </span>
        ) : (
          <span className="truncate text-sm text-secondary-400">
            Chọn đơn hàng...
          </span>
        )}
        <span className="flex shrink-0 items-center gap-1 text-secondary-400">
          {selectedOrder && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Bỏ chọn đơn hàng"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClear(e as unknown as React.MouseEvent);
              }}
              className="cursor-pointer rounded p-0.5 hover:bg-secondary-100 hover:text-secondary-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </span>
          )}
          <ChevronDownIcon
            className={[
              "h-4 w-4 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-secondary-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-secondary-100 px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-secondary-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo mã đơn hàng..."
              className="min-w-0 flex-1 bg-transparent text-sm text-secondary-700 outline-none placeholder:text-secondary-400"
            />
            {loading && (
              <span className="shrink-0 whitespace-nowrap text-xs text-secondary-400">
                Đang tìm...
              </span>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-secondary-400">
                {query.trim()
                  ? "Không tìm thấy đơn hàng phù hợp."
                  : "Bạn chưa có đơn hàng nào."}
              </li>
            ) : (
              results.map((o) => {
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(o)}
                      className={[
                        "flex w-full items-start gap-3 px-3 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-primary-50"
                          : "hover:bg-secondary-50",
                      ].join(" ")}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={[
                            "truncate text-sm font-semibold",
                            isSelected
                              ? "text-primary-700"
                              : "text-secondary-900",
                          ].join(" ")}
                        >
                          {o.id}
                        </p>
                        <p className="truncate text-xs text-secondary-400">
                          {formatDate(o.placedAt)} · {o.itemCount} sản phẩm
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {!query.trim() &&
            totalAvailable != null &&
            totalAvailable > results.length && (
              <p className="border-t border-secondary-100 px-3 py-2 text-center text-xs text-secondary-400">
                Hiển thị {results.length} / {totalAvailable} đơn — gõ mã đơn để
                tìm thêm.
              </p>
            )}
        </div>
      )}
    </div>
  );
}
