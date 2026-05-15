export interface LoyaltyReward {
  id: string;
  name: string;
  description: string | null;
  pointsRequired: number;
  promotionId: string;
  promotionCode?: string;
  promotionName?: string;
  isActive: boolean;
  stockLimit: number | null;
  redeemed: number;
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyEarnRuleScope {
  id: string;
  ruleId: string;
  scopeType: "category" | "brand" | "product";
  scopeRefId: string;
  scopeRefLabel: string;
  multiplier: number;
}

export interface LoyaltyEarnRule {
  id: string;
  name: string;
  description: string | null;
  pointsPerUnit: number;
  spendPerUnit: number;
  minOrderValue: number | null;
  maxPointsPerOrder: number | null;
  bonusTrigger: "first_order" | "birthday" | "manual" | null;
  bonusPoints: number | null;
  scopes: LoyaltyEarnRuleScope[];
  isActive: boolean;
  priority: number;
  validFrom: string | null;
  validUntil: string | null;
}

export interface LoyaltyTier {
  id: number;
  name: string;
  displayName: string;
  minPoints: number;
  maxPoints: number | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  customerCount?: number;
}

export interface LoyaltyRedemption {
  id: number;
  customerId: number;
  catalogId: number;
  nameSnapshot: string;
  pointsRedeemed: number;
  couponCode: string;
  status: "completed" | "cancelled" | "expired";
  redeemedAt: string;
}
