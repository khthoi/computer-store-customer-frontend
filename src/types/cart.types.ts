export type PromotionScopeType = "global" | "category" | "brand" | "variant";
export type PromotionActionType =
  | "percentage"
  | "fixed_cart"
  | "free_shipping"
  | "bulk"
  | "other";
export type PromotionSource = "auto" | "coupon";
export type PromotionStatus = "active" | "unmet" | "exhausted";

export interface AppliedPromotion {
  promotionId: number;
  name: string;
  source: PromotionSource;
  scopeType: PromotionScopeType;
  scopeLabel: string;
  actionType: PromotionActionType;
  mechanic: string;
  discountAmount: number;
  conditions: string[];
  status: PromotionStatus;
  unmetReason?: string;
  appliedToVariantIds?: string[];
  couponCode?: string;
}

export interface CartItemVariant {
  variantId: number;
  variantName: string;
  sku: string;
  price: number;
  originalPrice: number;
  status: string;
  productName: string;
  slug: string | null;
  categoryName: string | null;
  brands: string[];
  thumbnail: string | null;
  /** Legacy single-brand convenience field. Prefer `brands[]`. */
  brand?: string;
}

export interface CartItem {
  id: number;
  variantId: number;
  quantity: number;
  priceAtTime: number;
  addedAt: string;
  variant: CartItemVariant | null;
}

export interface Cart {
  id: number;
  customerId: number;
  couponCode: string | null;
  items: CartItem[];
  subtotal: number;
  totalDiscount: number;
  total: number;
  appliedPromotions: AppliedPromotion[];
  updatedAt: string;
}
