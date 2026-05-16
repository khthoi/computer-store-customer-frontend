"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { ToastMessage } from "@/src/components/ui/Toast";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Pagination } from "@/src/components/navigation/Pagination";
import { WishlistCard } from "@/src/components/account/wishlist/WishlistCard";
import { WishlistService, getMyWishlist } from "@/src/services/wishlist.service";
import { addCartItem } from "@/src/services/cart.service";
import { getCompareVariantById } from "@/src/services/compare.service";
import { useCompare } from "@/src/store/compare.store";
import type { WishlistVariantItem } from "@/src/types/wishlist.types";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WishlistPageInnerProps {
  initialItems: WishlistVariantItem[];
  page?: number;
  totalPages?: number;
  total?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WishlistPageInner — client root for /account/wishlist.
 *
 * State:
 * - items        : local mutable copy (optimistic removes)
 * - toastVisible : controls ToastMessage visibility
 * - toastMessage : message text shown in the toast
 */
export function WishlistPageInner({
  initialItems,
  page = 1,
  totalPages = 1,
  total: initialTotal,
}: WishlistPageInnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const compare = useCompare();
  const [items, setItems] = useState<WishlistVariantItem[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal ?? initialItems.length);

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] =
    useState<"success" | "error" | "info">("success");

  const compareVariantIds = useMemo(
    () => new Set(compare.state.compareList.map((p) => p.id)),
    [compare.state.compareList],
  );

  // ── Toast helper ──────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToastMessage(message);
      setToastType(type);
      setToastVisible(true);
    },
    [],
  );

  // ── Individual handlers ───────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;
      try {
        await WishlistService.removeItem(Number(target.variantId));
        setItems((prev) => prev.filter((i) => i.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        showToast("Đã xóa sản phẩm khỏi danh sách yêu thích");
        router.refresh();
      } catch {
        showToast("Xóa thất bại. Vui lòng thử lại.", "error");
      }
    },
    [items, router, showToast],
  );

  const handleAddToCart = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;
      const variantId = Number(target.variantId);
      if (!Number.isFinite(variantId) || variantId <= 0) {
        showToast("Phiên bản sản phẩm không hợp lệ", "error");
        return;
      }
      try {
        await addCartItem(variantId, 1);
        showToast("Đã thêm vào giỏ hàng");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Thêm vào giỏ hàng thất bại";
        showToast(msg, "error");
      }
    },
    [items, showToast],
  );

  const handleCompare = useCallback(
    async (id: string) => {
      const target = items.find((i) => i.id === id);
      if (!target) return;
      if (!target.productSlug) {
        showToast(
          "Sản phẩm chưa có dữ liệu so sánh đầy đủ, vui lòng thử lại sau",
          "error",
        );
        return;
      }
      try {
        const compareProduct = await getCompareVariantById({
          productSlug: target.productSlug,
          variantId: target.variantId,
        });
        if (!compareProduct) {
          showToast(
            "Không tải được dữ liệu so sánh cho sản phẩm này",
            "error",
          );
          return;
        }
        compare.addProduct(compareProduct);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Thêm vào so sánh thất bại";
        showToast(msg, "error");
      }
    },
    [items, compare, showToast],
  );

  // ── Bulk handlers ─────────────────────────────────────────────────────────
  // These operate on the user's FULL wishlist, not just the page currently shown.

  const inStockItems = items.filter((i) => !i.outOfStock);

  const handleAddAll = useCallback(async () => {
    try {
      const all = await getMyWishlist({ page: 1, limit: 1000 });
      const targets = all.items.filter((i) => !i.outOfStock);
      if (targets.length === 0) {
        showToast("Không có sản phẩm còn hàng để thêm vào giỏ", "info");
        return;
      }
      const results = await Promise.allSettled(
        targets.map((i) => addCartItem(Number(i.variantId), 1)),
      );
      const success = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - success;
      if (success > 0 && failed === 0) {
        showToast(`Đã thêm ${success} sản phẩm vào giỏ hàng`);
      } else if (success > 0) {
        showToast(
          `Đã thêm ${success} sản phẩm, ${failed} sản phẩm thất bại`,
          "info",
        );
      } else {
        showToast("Thêm vào giỏ hàng thất bại", "error");
      }
    } catch {
      showToast("Không thể tải danh sách yêu thích", "error");
    }
  }, [showToast]);

  const handleRemoveAll = useCallback(async () => {
    try {
      const all = await getMyWishlist({ page: 1, limit: 1000 });
      await Promise.all(
        all.items.map((i) => WishlistService.removeItem(Number(i.variantId))),
      );
      setItems([]);
      setTotal(0);
      showToast("Đã xóa toàn bộ danh sách yêu thích");
      router.refresh();
    } catch {
      showToast("Xóa thất bại. Vui lòng thử lại.", "error");
    }
  }, [router, showToast]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-100 px-6 py-5">
        <h1 className="text-lg font-bold text-secondary-900">
          Danh sách yêu thích{" "}
          <span className="font-normal text-secondary-400">
            ({total} sản phẩm)
          </span>
        </h1>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              disabled={inStockItems.length === 0}
              onClick={handleAddAll}
            >
              Thêm tất cả vào giỏ
            </Button>

            <button
              type="button"
              onClick={handleRemoveAll}
              className={[
                "inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-error-500",
                "cursor-pointer select-none h-10 px-4 text-sm",
                "bg-transparent text-error-600 hover:bg-error-50 active:bg-error-100",
              ].join(" ")}
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="px-6 py-6">
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => (
                <WishlistCard
                  key={item.id}
                  item={item}
                  isInCompare={compareVariantIds.has(item.variantId)}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                  onCompare={handleCompare}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex justify-end">
                <Pagination
                  size="sm"
                  page={page}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      <ToastMessage
        isVisible={toastVisible}
        type={toastType}
        message={toastMessage}
        position="bottom-right"
        duration={3000}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <HeartIcon className="h-16 w-16 text-secondary-300" aria-hidden />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-secondary-700">
          Danh sách yêu thích trống
        </p>
        <p className="text-sm text-secondary-400">
          Hãy thêm sản phẩm yêu thích để theo dõi và mua hàng dễ dàng hơn.
        </p>
      </div>
      <Link
        href="/products"
        className={[
          "inline-flex items-center justify-center gap-2 font-medium rounded transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500",
          "cursor-pointer select-none h-10 px-4 text-sm",
          "bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800",
        ].join(" ")}
      >
        Khám phá sản phẩm
      </Link>
    </div>
  );
}
