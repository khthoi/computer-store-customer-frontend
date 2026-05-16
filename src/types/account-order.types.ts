export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  name: string;
  variantLabel: string;
  thumbnailSrc: string;
  quantity: number;
  unitPrice: number;
}

export type OrderSummaryItem = OrderItem;

export interface OrderReview {
  rating: number;
  comment: string;
  variantLabel: string;
  productName: string;
  reviewedAt: string;
}

export interface OrderSummary {
  id: string;
  numericId: number;
  status: OrderStatus;
  placedAt: string;
  deliveredAt?: string;
  returnWindowDays: number;
  reviewWindowDays: number;
  items: OrderItem[];
  total: number;
  itemCount: number;
  review?: OrderReview;
}

export interface ProductReview {
  itemId: string;
  rating: number;
  title?: string;
  comment: string;
  reviewedAt: string;
  status: "pending" | "approved";
  /** Cloudinary URLs of attached images, in upload order. */
  images?: string[];
}

export interface OrderDetailItem {
  id: string;
  variantId: string;
  name: string;
  slug: string;
  thumbnailSrc: string;
  /** First brand (kept for backward-compat callers). Empty when product has no brand. */
  brand: string;
  /** All brands associated with the product. Empty array when none. */
  brands: string[];
  /** Leaf category name (for badge). Empty when category is missing. */
  categoryName: string;
  /** Variant SKU shown under the variant label. Empty when variant is missing. */
  sku: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  originalUnitPrice?: number;
  review?: ProductReview;
}

export interface TimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  note?: string;
  completed: boolean;
}

export interface ShippingInfo {
  recipientName: string;
  phone: string;
  address: string;
  carrierName: string;
  trackingCode: string;
  trackingUrl?: string;
}

export interface PaymentSummary {
  subtotal: number;
  discount: number;
  couponCode?: string;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  paymentMethod: { id: string; name: string };
}

export interface OrderDetail {
  id: string;
  numericId: number;
  status: OrderStatus;
  placedAt: string;
  deliveredAt?: string;
  returnWindowDays: number;
  reviewWindowDays: number;
  items: OrderDetailItem[];
  shipping: ShippingInfo;
  payment: PaymentSummary;
  timeline: TimelineEvent[];
  review?: OrderReview;
  total: number;
  itemCount: number;
  /** Reason given when the order was cancelled (set locally after cancel action). */
  cancelReason?: string;
}

export const ORDERS_PER_PAGE = 5;
