export type PromotionScopeType = "global" | "category" | "brand" | "variant";
export type PromotionActionType =
  | "percentage"
  | "fixed_cart"
  | "free_shipping"
  | "bulk"
  | "bundle"
  | "bxgy"
  | "other";
export type PromotionSource = "auto" | "coupon";
export type PromotionStatus = "active" | "unmet" | "exhausted";

export interface BundleComponentInfo {
  label: string;
  requiredQty: number;
  achievedQty: number;
  satisfied: boolean;
}

export interface BxgyInfo {
  buyQty: number;
  getQty: number;
  applications: number;
  giftVariantId: number | null;
  giftLabel: string | null;
  unitPrice: number;
  discountPct: number;
}

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
  appliesToShipping?: boolean;
  bundleComponents?: BundleComponentInfo[];
  bxgy?: BxgyInfo;
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
  freeShippingApplied: boolean;
  updatedAt: string;
}
