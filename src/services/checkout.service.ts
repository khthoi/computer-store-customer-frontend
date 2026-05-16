import { apiFetch } from "@/src/services/api";

export type ShippingMethod = "GiaoChuan" | "GiaoNhanh" | "NhanTaiCuaHang";
export type PaymentMethod = "COD" | "VNPay" | "MoMo" | "ZaloPay";

export interface CheckoutPayload {
  diaChiGiaoHangId: number;
  phuongThucVanChuyen: ShippingMethod;
  phuongThucThanhToan: PaymentMethod;
  couponCode?: string;
  ghiChuKhach?: string;
}

export interface CheckoutResult {
  order: {
    id: number;
    maDonHang: string;
    tongThanhToan: number;
    [key: string]: unknown;
  };
  paymentUrl?: string;
}

export interface CreatePaymentResult {
  transaction: { id: number; trangThaiGiaoDich: string };
  paymentUrl?: string;
}

export async function placeOrder(payload: CheckoutPayload): Promise<CheckoutResult> {
  return apiFetch<CheckoutResult>("/orders/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPayment(
  donHangId: number,
  method: PaymentMethod,
): Promise<CreatePaymentResult> {
  if (method === "COD") {
    return apiFetch<CreatePaymentResult>("/payments/create", {
      method: "POST",
      body: JSON.stringify({ donHangId, phuongThucThanhToan: "COD" }),
    });
  }

  const nganHangVi =
    method === "VNPay" ? "VNPay" : method === "MoMo" ? "MoMo" : "ZaloPay";

  return apiFetch<CreatePaymentResult>("/payments/create", {
    method: "POST",
    body: JSON.stringify({
      donHangId,
      phuongThucThanhToan: "ViDienTu",
      nganHangVi,
    }),
  });
}
