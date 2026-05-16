"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/components/ui/Toast";
import { Badge } from "@/src/components/ui/Badge";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import {
  getMyCart,
  updateCartItem,
  removeCartItem,
  applyCartCoupon,
  removeCartCoupon,
} from "@/src/services/cart.service";
import type { Cart, AppliedPromotion } from "@/src/types/cart.types";

function statusBadge(status: AppliedPromotion["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "active":
      return {
        label: "Đang áp dụng",
        className: "bg-success-50 text-success-700 border-success-200",
      };
    case "unmet":
      return {
        label: "Chưa đủ điều kiện",
        className: "bg-secondary-100 text-secondary-600 border-secondary-200",
      };
    case "exhausted":
      return {
        label: "Đã hết lượt",
        className: "bg-error-50 text-error-700 border-error-200",
      };
  }
}

function sourceBadge(source: AppliedPromotion["source"]): {
  label: string;
  className: string;
} {
  return source === "auto"
    ? {
        label: "Tự động",
        className: "bg-primary-50 text-primary-700 border-primary-200",
      }
    : {
        label: "Mã coupon",
        className: "bg-warning-50 text-warning-700 border-warning-200",
      };
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Thao tác không thành công";
}

export function CartPageReal() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await getMyCart();
      setCart(data);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onQtyChange = useCallback(
    async (itemId: number, qty: number) => {
      if (qty < 1) return;
      setBusy(true);
      try {
        const next = await updateCartItem(itemId, qty);
        setCart(next);
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      } finally {
        setBusy(false);
      }
    },
    [showToast],
  );

  const onRemove = useCallback(
    async (itemId: number) => {
      setBusy(true);
      try {
        const next = await removeCartItem(itemId);
        setCart(next);
        showToast("Đã xoá sản phẩm khỏi giỏ", "success");
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      } finally {
        setBusy(false);
      }
    },
    [showToast],
  );

  const onApplyCoupon = useCallback(async () => {
    const code = couponInput.trim();
    if (!code) return;
    setBusy(true);
    try {
      const next = await applyCartCoupon(code);
      setCart(next);
      setCouponInput("");
      showToast("Đã áp mã giảm giá", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }, [couponInput, showToast]);

  const onRemoveCoupon = useCallback(async () => {
    setBusy(true);
    try {
      const next = await removeCartCoupon();
      setCart(next);
      showToast("Đã gỡ mã giảm giá", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-secondary-500">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-secondary-900">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-2 text-secondary-500">
          Hãy khám phá sản phẩm và thêm vào giỏ để tiếp tục mua sắm.
        </p>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Mua sắm ngay
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-secondary-900">Giỏ hàng</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const v = item.variant;
            const currentPrice = item.priceAtTime;
            const originalPrice = v?.originalPrice ?? currentPrice;
            const hasDiscount = originalPrice > currentPrice;
            const discountPct = hasDiscount
              ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
              : 0;
            const brands = v?.brands ?? (v?.brand ? [v.brand] : []);

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border border-secondary-200 bg-white p-4"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-secondary-100 bg-secondary-50 p-2">
                  {v?.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt={v?.productName ?? ""}
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Brand + category badges — single line, truncate with tooltip per badge */}
                  <div className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden">
                    {brands.map((b) => (
                      <Tooltip
                        key={b}
                        content={b}
                        placement="top"
                        anchorToContent
                      >
                        <span className="inline-flex max-w-[8rem] shrink-0 items-center rounded bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-600">
                          <span className="block truncate">{b}</span>
                        </span>
                      </Tooltip>
                    ))}
                    {v?.categoryName && (
                      <Tooltip
                        content={v.categoryName}
                        placement="top"
                        anchorToContent
                      >
                        <span className="inline-flex max-w-[10rem] shrink-0 items-center rounded bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                          <span className="block truncate">
                            {v.categoryName}
                          </span>
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  {/* Product name */}
                  <Tooltip
                    content={v?.productName ?? "Sản phẩm"}
                    placement="top"
                    anchorToContent
                  >
                    <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-secondary-900">
                      {v?.productName ?? "Sản phẩm"}
                    </p>
                  </Tooltip>

                  {/* SKU badge — single line, truncate with tooltip */}
                  {v?.sku && (
                    <div className="mt-1 flex min-w-0">
                      <Tooltip content={v.sku} placement="top" anchorToContent>
                        <Badge
                          variant="default"
                          size="sm"
                          className="font-mono tracking-wide min-w-0 max-w-[14rem]"
                        >
                          <span className="block truncate">{v.sku}</span>
                        </Badge>
                      </Tooltip>
                    </div>
                  )}

                  {/* Variant label */}
                  <p className="mt-1 text-xs text-secondary-500">
                    Phiên bản: {v?.variantName ?? "—"}
                  </p>

                  {/* Price block — current + strikethrough original + discount badge */}
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-semibold text-primary-700">
                      {formatVND(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-xs text-secondary-400 line-through">
                          {formatVND(originalPrice)}
                        </span>
                        <span className="inline-flex items-center rounded bg-error-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          -{discountPct}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busy || item.quantity <= 1}
                      onClick={() => onQtyChange(item.id, item.quantity - 1)}
                      className="h-8 w-8 rounded-md border border-secondary-200 text-secondary-600 disabled:opacity-40"
                      aria-label="Giảm số lượng"
                    >
                      −
                    </button>
                    <span className="min-w-[2ch] text-center text-sm font-medium text-secondary-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onQtyChange(item.id, item.quantity + 1)}
                      className="h-8 w-8 rounded-md border border-secondary-200 text-secondary-600 disabled:opacity-40"
                      aria-label="Tăng số lượng"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRemove(item.id)}
                    className="text-xs text-error-600 hover:underline disabled:opacity-40"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="space-y-4">
          {/* Coupon section */}
          <div className="rounded-xl border border-secondary-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600">
              Mã giảm giá
            </h2>
            {cart.couponCode ? (
              <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2">
                <span className="font-mono text-sm font-semibold text-primary-700">
                  {cart.couponCode}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onRemoveCoupon}
                  className="text-xs font-medium text-error-600 hover:underline"
                >
                  Gỡ
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Nhập mã"
                  className="flex-1 rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={busy || !couponInput.trim()}
                  onClick={onApplyCoupon}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Áp dụng
                </button>
              </div>
            )}
          </div>

          {/* Applied promotions */}
          {cart.appliedPromotions.length > 0 && (
            <div className="rounded-xl border border-secondary-200 bg-white p-4 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600">
                Khuyến mãi
              </h2>
              {cart.appliedPromotions.map((p) => {
                const sb = sourceBadge(p.source);
                const st = statusBadge(p.status);
                return (
                  <div
                    key={`${p.source}-${p.promotionId}`}
                    className="rounded-lg border border-secondary-100 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${sb.className}`}
                      >
                        {sb.label}
                      </span>
                      <span
                        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold ${st.className}`}
                      >
                        {st.label}
                      </span>
                      {p.couponCode && (
                        <span className="font-mono text-[11px] text-secondary-600">
                          {p.couponCode}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-secondary-900">
                      {p.name}
                    </p>
                    <p className="mt-0.5 text-secondary-600">
                      Đối tượng áp dụng: {p.scopeLabel}
                    </p>
                    <p className="text-secondary-600">Cơ chế: {p.mechanic}</p>
                    {p.conditions.length > 0 && (
                      <ul className="mt-1 list-disc pl-4 text-secondary-500">
                        {p.conditions.map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    )}
                    {p.status === "active" && p.discountAmount > 0 && (
                      <p className="mt-1.5 text-sm font-semibold text-success-700">
                        −{formatVND(p.discountAmount)}
                      </p>
                    )}
                    {p.status !== "active" && p.unmetReason && (
                      <p className="mt-1.5 text-secondary-500">{p.unmetReason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div className="rounded-xl border border-secondary-200 bg-white p-4 space-y-2">
            <div className="flex justify-between text-sm text-secondary-700">
              <span>Tạm tính</span>
              <span>{formatVND(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-secondary-700">
              <span>Giảm giá</span>
              <span className="text-success-700">
                −{formatVND(cart.totalDiscount)}
              </span>
            </div>
            <div className="my-2 border-t border-secondary-100" />
            <div className="flex justify-between text-base font-semibold text-secondary-900">
              <span>Thành tiền</span>
              <span className="text-primary-700">{formatVND(cart.total)}</span>
            </div>
            <button
              type="button"
              disabled={busy || cart.items.length === 0}
              onClick={() => router.push("/checkout")}
              className="mt-3 w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Tiến hành thanh toán
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
