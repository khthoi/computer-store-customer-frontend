export interface SuccessOrderItem {
  id: string;
  name: string;
  slug: string;
  thumbnailSrc: string;
  brand: string;
  variantLabel: string;
  quantity: number;
  currentPrice: number;
  originalPrice: number;
  discountPct: number;
  flashSale?: { id: number; name: string } | null;
}

export type AppliedPromotionType = "coupon" | "auto" | "flashsale";

export interface AppliedPromotion {
  id?: number | null;
  name: string;
  type: AppliedPromotionType;
  amount: number;
  maCoupon?: string | null;
}

export interface SuccessOrder {
  id: string;
  numericId: number;
  placedAt: string;
  estimatedDelivery: string;
  estimatedDeliveryIso: string;
  customerEmail: string;
  recipient: {
    fullName: string;
    phone: string;
    email: string;
    province: string;
    district: string;
    ward: string;
    addressDetail: string;
  };
  shippingMethod: { id: string; name: string; price: number };
  paymentMethod: { id: string; name: string; status: "unpaid" | "paid" | "refunded" };
  items: SuccessOrderItem[];
  pricing: {
    subtotal: number;
    savings: number;
    couponCode?: string | null;
    couponDiscount: number;
    appliedPromotions: AppliedPromotion[];
    shippingFee: number;
    total: number;
  };
}

export interface RecommendedProduct {
  id: string;
  name: string;
  brand: string;
  href: string;
  thumbnail: string;
  thumbnailAlt?: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  stockStatus?: "in-stock" | "low-stock" | "out-of-stock";
}
