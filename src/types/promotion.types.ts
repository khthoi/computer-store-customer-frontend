export type PromotionType =
  | "standard"
  | "bxgy"
  | "bundle"
  | "bulk"
  | "free_shipping";

export type PromotionStatus =
  | "draft"
  | "active"
  | "scheduled"
  | "paused"
  | "ended"
  | "cancelled";

export type StackingPolicy =
  | "exclusive"
  | "stackable"
  | "stackable_with_coupons_only";

export type ScopeType = "global" | "category" | "product" | "variant" | "brand";

export interface PromotionScope {
  id: number;
  promotionId: number;
  scopeType: ScopeType;
  scopeRefId: string | null;
  scopeRefLabel: string | null;
}

export type ConditionType =
  | "min_order_value"
  | "min_item_quantity"
  | "customer_group"
  | "required_products"
  | "required_categories"
  | "payment_method"
  | "platform"
  | "first_order_only";

export type ConditionOperator =
  | "gte"
  | "lte"
  | "eq"
  | "in"
  | "all_in_cart"
  | "any_in_cart";

export interface PromotionCondition {
  id: number;
  promotionId: number;
  type: ConditionType;
  operator: ConditionOperator;
  value: string;
}

export interface BulkTier {
  id: number;
  actionId: number;
  minQuantity: number;
  maxQuantity: number | null;
  discountValue: number;
  discountType: "percentage" | "fixed";
}

export interface BulkComponent {
  id: number;
  actionId: number;
  scope: "category" | "product" | "variant";
  refId: string;
  refLabel: string | null;
  minQuantity: number;
}

export type ActionType =
  | "percentage_discount"
  | "fixed_discount_item"
  | "fixed_discount_cart"
  | "free_item"
  | "bxgy"
  | "bundle_discount"
  | "bulk_discount"
  | "free_shipping";

export type ApplicationLevel = "per_item" | "cart_total" | "cheapest_item";

export interface PromotionAction {
  id: number;
  promotionId: number;
  actionType: ActionType;
  applicationLevel: ApplicationLevel;
  discountType: "percentage" | "fixed" | null;
  discountValue: number | null;
  maxDiscountAmount: number | null;

  bxgyBuyQty: number | null;
  bxgyBuyProductId: string | null;
  bxgyGetQty: number | null;
  bxgyGetProductId: string | null;
  bxgyGetDiscountPct: number | null;
  bxgyDeliveryMode: "auto_add" | "customer_selects" | null;
  bxgyMaxApplications: number | null;
  bxgyEligibleProductIds: string | null;

  bulkTiers?: BulkTier[];
  bulkComponents?: BulkComponent[];
}

export interface Promotion {
  id: number;
  name: string;
  description: string | null;
  type: PromotionType;
  isCoupon: boolean;
  code: string | null;
  status: PromotionStatus;
  priority: number;
  stackingPolicy: StackingPolicy;
  startDate: string;
  endDate: string;
  totalUsageLimit: number | null;
  perCustomerLimit: number | null;
  usageCount: number;
  scopes: PromotionScope[];
  conditions: PromotionCondition[];
  actions: PromotionAction[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}
