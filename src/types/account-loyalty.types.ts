export type PointTransactionType = "earn" | "redeem" | "expire" | "adjust";

export type MemberTier = "Đồng" | "Bạc" | "Vàng" | "Bạch Kim";

export interface PointTransaction {
  id: string;
  type: PointTransactionType;
  description: string;
  points: number;
  balanceAfter: number;
  createdAt: string;
}

export interface PointsData {
  balance: number;
  tier: MemberTier;
  tierProgressPercent: number;
  pointsToNextTier: number;
  nextTier: MemberTier | null;
  history: PointTransaction[];
}

export type EarnBonusTrigger = "first_order" | "birthday" | "manual";

export interface EarnRule {
  id: string;
  name: string;
  description: string;
  pointsPerUnit: number;
  spendPerUnit: number;
  minOrderValue: number | null;
  maxPointsPerOrder: number | null;
  bonusTrigger: EarnBonusTrigger | null;
  bonusPoints: number | null;
}

export interface RedemptionCatalogItem {
  id: number;
  name: string;
  pointsRequired: number;
  promotionId: number | null;
  stockLimit: number | null;
  redeemed: number;
  validFrom: string | null;
  validUntil: string | null;
}

export type RedemptionStatus = "completed" | "pending" | "used" | "expired" | "cancelled";

export interface RedemptionRecord {
  id: number;
  catalogId: number;
  catalogName: string;
  pointsSpent: number;
  couponCode: string;
  status: RedemptionStatus;
  redeemedAt: string;
  usedAt: string | null;
  orderId: number | null;
}
