"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CheckBadgeIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  ShieldCheckIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { useToast } from "@/src/components/ui/Toast";
import { formatVND } from "@/src/lib/format";
import { getMyCart } from "@/src/services/cart.service";
import {
  createAddress,
  getMyAddresses,
  setDefaultAddress,
} from "@/src/services/account-address.service";
import {
  placeOrder,
  createPayment,
  type PaymentMethod,
  type ShippingMethod,
} from "@/src/services/checkout.service";
import type { Cart } from "@/src/types/cart.types";
import type {
  Address,
  CreateAddressInput,
} from "@/src/types/account-address.types";

const SHIPPING_LABELS: Record<ShippingMethod, { label: string; fee: number }> = {
  GiaoChuan: { label: "Giao chuẩn (25.000₫)", fee: 25000 },
  GiaoNhanh: { label: "Giao nhanh (40.000₫)", fee: 40000 },
  NhanTaiCuaHang: { label: "Nhận tại cửa hàng (miễn phí)", fee: 0 },
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  VNPay: "VNPay (ATM / Visa / Master / JCB / QR)",
  ZaloPay: "ZaloPay (Ví ZaloPay / Visa / Master / JCB / ATM)",
  MoMo: "Ví MoMo",
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Đặt hàng không thành công";
}

function emptyAddressForm(): CreateAddressInput {
  return {
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
    isDefault: false,
  };
}

function validateNewAddress(form: CreateAddressInput): string | null {
  if (!form.fullName.trim()) return "Vui lòng nhập họ tên người nhận";
  if (!/^\d{9,11}$/.test(form.phone.trim())) return "Số điện thoại không hợp lệ";
  if (!form.province.trim()) return "Vui lòng nhập tỉnh/thành phố";
  if (!form.district.trim()) return "Vui lòng nhập quận/huyện";
  if (!form.ward.trim()) return "Vui lòng nhập phường/xã";
  if (!form.street.trim()) return "Vui lòng nhập địa chỉ cụ thể";
  return null;
}

export function CheckoutPageReal() {
  const router = useRouter();
  const { showToast } = useToast();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingMethod>("GiaoChuan");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddrForm, setNewAddrForm] = useState<CreateAddressInput>(
    emptyAddressForm,
  );
  const [savingNewAddr, setSavingNewAddr] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([getMyCart(), getMyAddresses()]);
        setCart(c);
        setAddresses(a);
        const def = a.find((x) => x.isDefault) ?? a[0];
        if (def) setAddressId(def.id);
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const handleSetDefault = useCallback(
    async (id: string) => {
      setSettingDefaultId(id);
      try {
        await setDefaultAddress(id);
        setAddresses((prev) =>
          prev.map((x) => ({ ...x, isDefault: x.id === id })),
        );
        showToast("Đã đặt làm địa chỉ mặc định", "success");
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      } finally {
        setSettingDefaultId(null);
      }
    },
    [showToast],
  );

  const handleSaveNewAddress = useCallback(async () => {
    const err = validateNewAddress(newAddrForm);
    if (err) {
      showToast(err, "error");
      return;
    }
    setSavingNewAddr(true);
    try {
      const created = await createAddress(newAddrForm);
      setAddresses((prev) => {
        const next = newAddrForm.isDefault
          ? prev.map((x) => ({ ...x, isDefault: false }))
          : prev.slice();
        next.push(created);
        return next;
      });
      setAddressId(created.id);
      setShowNewAddressForm(false);
      setNewAddrForm(emptyAddressForm());
      showToast("Đã thêm địa chỉ mới", "success");
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSavingNewAddr(false);
    }
  }, [newAddrForm, showToast]);

  const updateNewAddrField = useCallback(
    <K extends keyof CreateAddressInput>(field: K, value: CreateAddressInput[K]) => {
      setNewAddrForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const onPlaceOrder = useCallback(async () => {
    if (!addressId) {
      showToast("Vui lòng chọn địa chỉ giao hàng", "error");
      return;
    }
    if (!cart || cart.items.length === 0) {
      showToast("Giỏ hàng đang trống", "error");
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeOrder({
        diaChiGiaoHangId: Number(addressId),
        phuongThucVanChuyen: shipping,
        phuongThucThanhToan: payment,
        couponCode: cart.couponCode ?? undefined,
        ghiChuKhach: note.trim() || undefined,
      });

      if (payment !== "COD") {
        const pay = await createPayment(result.order.id, payment);
        if (pay.paymentUrl) {
          window.location.href = pay.paymentUrl;
          return;
        }
        showToast("Không lấy được liên kết thanh toán, vui lòng thử lại", "error");
        return;
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }
      router.push(`/checkout/success?orderId=${result.order.id}`);
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  }, [addressId, cart, shipping, payment, note, router, showToast]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-secondary-500">Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-secondary-900">
          Giỏ hàng đang trống
        </h1>
        <p className="mt-2 text-secondary-500">
          Hãy thêm sản phẩm vào giỏ trước khi tiến hành thanh toán.
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

  const shippingFee = SHIPPING_LABELS[shipping].fee;
  const grandTotal = cart.total + shippingFee;
  const totalItemCount = cart.items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-secondary-900">Thanh toán</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Address */}
          <section className="rounded-xl border border-secondary-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600 flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                Địa chỉ giao hàng
              </h2>
              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
                >
                  <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  Thêm địa chỉ mới
                </button>
              )}
            </div>

            {addresses.length === 0 && !showNewAddressForm ? (
              <p className="mt-3 text-sm text-secondary-500">
                Bạn chưa có địa chỉ nào. Hãy bấm{" "}
                <span className="font-semibold text-primary-700">Thêm địa chỉ mới</span>{" "}
                để nhập thông tin giao hàng.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {addresses.map((a) => {
                  const isSelected = addressId === a.id;
                  return (
                    <div
                      key={a.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-primary-600 bg-primary-50"
                          : "border-secondary-200 hover:border-secondary-300"
                      }`}
                    >
                      <input
                        id={`addr-${a.id}`}
                        type="radio"
                        name="address"
                        checked={isSelected}
                        onChange={() => setAddressId(a.id)}
                        className="mt-1 cursor-pointer accent-primary-600"
                      />
                      <label
                        htmlFor={`addr-${a.id}`}
                        className="flex-1 min-w-0 cursor-pointer text-sm"
                      >
                        <p className="font-semibold text-secondary-900">
                          {a.fullName}{" "}
                          <span className="font-normal text-secondary-500">
                            · {a.phone}
                          </span>
                        </p>
                        <p className="mt-0.5 text-secondary-600">
                          {a.street}, {a.ward}, {a.district}, {a.province}
                        </p>
                        {a.isDefault && (
                          <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-success-700">
                            <CheckBadgeIcon className="h-3 w-3" aria-hidden="true" />
                            Mặc định
                          </span>
                        )}
                      </label>
                      {!a.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(a.id)}
                          disabled={settingDefaultId === a.id}
                          className="shrink-0 self-center rounded-md border border-secondary-200 bg-white px-2.5 py-1 text-xs font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50"
                        >
                          {settingDefaultId === a.id ? "Đang lưu..." : "Đặt mặc định"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showNewAddressForm && (
              <div className="mt-4 rounded-lg border border-dashed border-primary-300 bg-primary-50/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                    <PencilSquareIcon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                    Nhập địa chỉ giao hàng mới
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(false);
                      setNewAddrForm(emptyAddressForm());
                    }}
                    className="rounded-md p-1 text-secondary-500 hover:bg-secondary-100"
                    aria-label="Đóng"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-secondary-700">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={newAddrForm.fullName}
                      onChange={(e) => updateNewAddrField("fullName", e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={newAddrForm.phone}
                      onChange={(e) => updateNewAddrField("phone", e.target.value)}
                      placeholder="0901234567"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700">
                      Tỉnh / Thành phố
                    </label>
                    <input
                      type="text"
                      value={newAddrForm.province}
                      onChange={(e) => updateNewAddrField("province", e.target.value)}
                      placeholder="Hà Nội"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700">
                      Quận / Huyện
                    </label>
                    <input
                      type="text"
                      value={newAddrForm.district}
                      onChange={(e) => updateNewAddrField("district", e.target.value)}
                      placeholder="Cầu Giấy"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-secondary-700">
                      Phường / Xã
                    </label>
                    <input
                      type="text"
                      value={newAddrForm.ward}
                      onChange={(e) => updateNewAddrField("ward", e.target.value)}
                      placeholder="Dịch Vọng"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-secondary-700">
                      Địa chỉ cụ thể (số nhà, đường)
                    </label>
                    <input
                      type="text"
                      value={newAddrForm.street}
                      onChange={(e) => updateNewAddrField("street", e.target.value)}
                      placeholder="123 Trần Duy Hưng"
                      className="mt-1 w-full rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <label className="mt-3 inline-flex items-center gap-2 text-sm text-secondary-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddrForm.isDefault}
                    onChange={(e) => updateNewAddrField("isDefault", e.target.checked)}
                    className="accent-primary-600"
                  />
                  Đặt làm địa chỉ mặc định
                </label>

                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(false);
                      setNewAddrForm(emptyAddressForm());
                    }}
                    disabled={savingNewAddr}
                    className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewAddress}
                    disabled={savingNewAddr}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {savingNewAddr ? "Đang lưu..." : "Lưu địa chỉ"}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Shipping */}
          <section className="rounded-xl border border-secondary-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600">
              Phương thức vận chuyển
            </h2>
            <div className="mt-3 space-y-2">
              {(Object.keys(SHIPPING_LABELS) as ShippingMethod[]).map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    shipping === m
                      ? "border-primary-600 bg-primary-50"
                      : "border-secondary-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={shipping === m}
                    onChange={() => setShipping(m)}
                  />
                  <span className="text-sm text-secondary-700">
                    {SHIPPING_LABELS[m].label}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-secondary-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600">
              Phương thức thanh toán
            </h2>
            <div className="mt-3 space-y-2">
              {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((m) => (
                <label
                  key={m}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    payment === m
                      ? "border-primary-600 bg-primary-50"
                      : "border-secondary-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === m}
                    onChange={() => setPayment(m)}
                  />
                  <span className="text-sm text-secondary-700">
                    {PAYMENT_LABELS[m]}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-secondary-500">
              Lưu ý: Mã giảm giá chỉ thực sự được trừ lượt sử dụng sau khi đơn
              hàng được xác nhận thanh toán thành công. Nếu bạn không thanh toán,
              mã sẽ không bị tiêu hao.
            </p>
          </section>

          {/* Note */}
          <section className="rounded-xl border border-secondary-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-600">
              Ghi chú
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Ví dụ: Giao buổi sáng, gọi trước 30 phút..."
              className="mt-3 w-full rounded-lg border border-secondary-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            />
          </section>
        </div>

        {/* Summary */}
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm">
            <div className="border-b border-secondary-100 bg-secondary-50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-secondary-700">
                Tóm tắt đơn hàng
              </h2>
              <p className="mt-0.5 text-xs text-secondary-500">
                {cart.items.length} sản phẩm · {totalItemCount} món
              </p>
            </div>

            {/* Item list with thumbnail */}
            <ul className="max-h-80 space-y-3 overflow-y-auto px-4 py-3">
              {cart.items.map((item) => {
                const v = item.variant;
                const productName = v?.productName ?? "Sản phẩm";
                const variantName = v?.variantName ?? "";
                const thumb = v?.thumbnail ?? "";
                const slug = v?.slug ?? null;
                const currentPrice = item.priceAtTime;
                const originalPrice = v?.originalPrice ?? currentPrice;
                const hasDiscount = originalPrice > currentPrice;
                const discountPct = hasDiscount
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0;
                const lineTotal = currentPrice * item.quantity;
                const lineOriginal = originalPrice * item.quantity;

                const thumbnailNode = (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-secondary-100 bg-secondary-50">
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt={productName}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                    <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-secondary-900 px-1 text-[10px] font-semibold leading-none text-white">
                      {item.quantity}
                    </span>
                  </div>
                );

                const productNameNode = (
                  <Tooltip content={productName} placement="top" delay={300} anchorToContent>
                    {slug ? (
                      <a
                        href={`/products/${slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-xs font-medium text-secondary-800 hover:text-primary-600 hover:underline"
                      >
                        {productName}
                      </a>
                    ) : (
                      <span className="block truncate text-xs font-medium text-secondary-800 cursor-default">
                        {productName}
                      </span>
                    )}
                  </Tooltip>
                );

                return (
                  <li key={item.id} className="flex items-start gap-3">
                    {slug ? (
                      <a
                        href={`/products/${slug}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={productName}
                        className="shrink-0"
                      >
                        {thumbnailNode}
                      </a>
                    ) : (
                      thumbnailNode
                    )}

                    <div className="min-w-0 flex-1">
                      {productNameNode}

                      {variantName && (
                        <Tooltip content={variantName} placement="top" delay={300} anchorToContent>
                          <p className="mt-0.5 truncate text-[11px] text-secondary-500 cursor-default">
                            {variantName}
                          </p>
                        </Tooltip>
                      )}

                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-primary-700">
                          {formatVND(currentPrice)}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-[10px] text-secondary-400 line-through">
                              {formatVND(originalPrice)}
                            </span>
                            <span className="rounded bg-error-50 px-1 py-px text-[10px] font-bold text-error-600">
                              -{discountPct}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-secondary-900">
                        {formatVND(lineTotal)}
                      </p>
                      {hasDiscount && (
                        <p className="text-[10px] text-secondary-400 line-through">
                          {formatVND(lineOriginal)}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Totals */}
            <div className="border-t border-secondary-100 px-4 py-3 space-y-1.5">
              <div className="flex justify-between text-sm text-secondary-700">
                <span>Tạm tính ({totalItemCount} món)</span>
                <span>{formatVND(cart.subtotal)}</span>
              </div>
              {cart.totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-secondary-700">
                  <span>Giảm giá</span>
                  <span className="font-medium text-success-700">
                    −{formatVND(cart.totalDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-secondary-700">
                <span className="flex items-center gap-1.5">
                  <TruckIcon className="h-4 w-4 text-secondary-400" aria-hidden="true" />
                  Phí vận chuyển
                </span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="font-medium text-success-700">Miễn phí</span>
                  ) : (
                    formatVND(shippingFee)
                  )}
                </span>
              </div>
              {cart.couponCode && (
                <div className="flex justify-between text-xs text-secondary-500">
                  <span>Mã đã áp</span>
                  <span className="rounded bg-primary-50 px-1.5 py-0.5 font-mono text-primary-700">
                    {cart.couponCode}
                  </span>
                </div>
              )}
            </div>

            {/* Grand total */}
            <div className="border-t border-secondary-100 bg-secondary-50/50 px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-secondary-900">
                  Thành tiền
                </span>
                <span className="text-lg font-bold text-primary-700">
                  {formatVND(grandTotal)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-secondary-500">
                Đã bao gồm VAT (nếu có). Phí vận chuyển tính theo phương thức đã chọn.
              </p>
            </div>

            <div className="border-t border-secondary-100 px-4 py-3">
              <button
                type="button"
                disabled={submitting}
                onClick={onPlaceOrder}
                className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? "Đang đặt hàng..." : `Đặt hàng · ${formatVND(grandTotal)}`}
              </button>
              <div className="mt-3 flex items-start gap-2 text-[11px] text-secondary-500">
                <ShieldCheckIcon className="mt-px h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                <p>
                  Thông tin của bạn được bảo mật. Bằng việc đặt hàng, bạn đồng ý
                  với{" "}
                  <a
                    href="/info/dieu-khoan-dich-vu"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-primary-700 hover:text-primary-800 hover:underline"
                  >
                    điều khoản dịch vụ
                  </a>{" "}
                  của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
