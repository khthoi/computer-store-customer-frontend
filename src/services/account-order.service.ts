import { apiFetch } from "@/src/services/api";
import type {
  OrderDetail,
  OrderStatus,
  OrderSummary,
  TimelineEvent,
} from "@/src/types/account-order.types";

const BE_TO_FE_STATUS: Record<string, OrderStatus> = {
  ChoTT: "pending",
  ChoXacNhan: "pending",
  DaXacNhan: "confirmed",
  DongGoi: "preparing",
  DangGiao: "shipping",
  DaGiao: "delivered",
  DaHuy: "cancelled",
  HoanTra: "delivered",
};

const FE_TO_BE_STATUS: Record<OrderStatus, string> = {
  pending: "ChoXacNhan",
  confirmed: "DaXacNhan",
  preparing: "DongGoi",
  shipping: "DangGiao",
  delivered: "DaGiao",
  cancelled: "DaHuy",
};

const FALLBACK_THUMB =
  "https://hanoicomputercdn.com/media/product/placeholder.jpg";

interface RawListItem {
  id: string;
  name: string;
  variantLabel: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPrice: number;
}

interface RawSummary {
  numericId: number;
  id: string;
  status: string;
  placedAt: string;
  deliveredAt: string | null;
  returnWindowDays: number;
  reviewWindowDays: number;
  total: number;
  itemCount: number;
  items: RawListItem[];
}

interface RawDetailItem extends RawListItem {
  variantId: string;
  slug: string;
  brand: string;
  brands?: string[];
  categoryName?: string;
  sku?: string;
  subtotal: number;
  originalUnitPrice: number | null;
  review: {
    rating: number;
    title: string | null;
    content: string | null;
    images?: string[];
    status: "pending" | "approved";
    reviewedAt: string;
  } | null;
}

interface RawDetail {
  numericId: number;
  id: string;
  status: string;
  placedAt: string;
  deliveredAt: string | null;
  returnWindowDays: number;
  reviewWindowDays: number;
  total: number;
  itemCount: number;
  items: RawDetailItem[];
  shipping: {
    recipientName: string;
    phone: string;
    address: string;
    carrierName: string | null;
    trackingCode: string | null;
    trackingUrl: string | null;
  };
  payment: {
    subtotal: number;
    discount: number;
    couponCode: string | null;
    couponDiscount: number;
    shippingFee: number;
    total: number;
    paymentMethodId: string;
    paymentMethodName: string;
  };
  timeline: Array<{
    status: string;
    label: string;
    timestamp: string | null;
    note?: string;
    completed: boolean;
  }>;
}

function mapSummary(r: RawSummary): OrderSummary {
  return {
    id: r.id,
    numericId: r.numericId,
    status: BE_TO_FE_STATUS[r.status] ?? "pending",
    placedAt: r.placedAt,
    deliveredAt: r.deliveredAt ?? undefined,
    returnWindowDays: r.returnWindowDays,
    reviewWindowDays: r.reviewWindowDays,
    total: r.total,
    itemCount: r.itemCount,
    items: r.items.map((i) => ({
      id: i.id,
      name: i.name,
      variantLabel: i.variantLabel,
      thumbnailSrc: i.thumbnailUrl ?? FALLBACK_THUMB,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

function mapTimeline(t: RawDetail["timeline"][number]): TimelineEvent {
  return {
    status: BE_TO_FE_STATUS[t.status] ?? "pending",
    label: t.label,
    timestamp: t.timestamp,
    note: t.note,
    completed: t.completed,
  };
}

function mapDetail(r: RawDetail): OrderDetail {
  return {
    id: r.id,
    numericId: r.numericId,
    status: BE_TO_FE_STATUS[r.status] ?? "pending",
    placedAt: r.placedAt,
    deliveredAt: r.deliveredAt ?? undefined,
    returnWindowDays: r.returnWindowDays,
    reviewWindowDays: r.reviewWindowDays,
    total: r.total,
    itemCount: r.itemCount,
    items: r.items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      name: i.name,
      slug: i.slug,
      brand: i.brand,
      brands: i.brands ?? (i.brand ? [i.brand] : []),
      categoryName: i.categoryName ?? "",
      sku: i.sku ?? "",
      variantLabel: i.variantLabel,
      thumbnailSrc: i.thumbnailUrl ?? FALLBACK_THUMB,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.subtotal,
      originalUnitPrice: i.originalUnitPrice ?? undefined,
      review: i.review
        ? {
            itemId: i.id,
            rating: i.review.rating,
            title: i.review.title ?? undefined,
            comment: i.review.content ?? "",
            reviewedAt: i.review.reviewedAt,
            status: i.review.status,
            images: i.review.images ?? [],
          }
        : undefined,
    })),
    shipping: {
      recipientName: r.shipping.recipientName,
      phone: r.shipping.phone,
      address: r.shipping.address,
      carrierName: r.shipping.carrierName ?? "",
      trackingCode: r.shipping.trackingCode ?? "",
      trackingUrl: r.shipping.trackingUrl ?? undefined,
    },
    payment: {
      subtotal: r.payment.subtotal,
      discount: r.payment.discount,
      couponCode: r.payment.couponCode ?? undefined,
      couponDiscount: r.payment.couponDiscount,
      shippingFee: r.payment.shippingFee,
      total: r.payment.total,
      paymentMethod: {
        id: r.payment.paymentMethodId,
        name: r.payment.paymentMethodName,
      },
    },
    timeline: r.timeline.map(mapTimeline),
  };
}

export interface OrderListParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
  q?: string;
}

export async function getMyOrders(
  params: OrderListParams = {},
): Promise<{ items: OrderSummary[]; total: number; totalPages: number }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  if (params.status) qs.set("trangThai", FE_TO_BE_STATUS[params.status]);
  if (params.q && params.q.trim()) qs.set("q", params.q.trim());

  const raw = await apiFetch<{
    items: RawSummary[];
    total: number;
    totalPages: number;
  }>(`/orders?${qs}`);
  return {
    items: raw.items.map(mapSummary),
    total: raw.total,
    totalPages: raw.totalPages,
  };
}

export async function getOrderDetail(numericId: number): Promise<OrderDetail> {
  const raw = await apiFetch<RawDetail>(`/orders/${numericId}`);
  return mapDetail(raw);
}

export async function cancelOrder(numericId: number): Promise<void> {
  await apiFetch<void>(`/orders/${numericId}/cancel`, { method: "DELETE" });
}
