import { apiFetch } from "@/src/services/api";
import type {
  LoyaltyEarnRule,
  LoyaltyRedemption,
  LoyaltyReward,
  LoyaltyTier,
} from "@/src/types/loyalty.types";

export async function getRedemptionCatalog(): Promise<LoyaltyReward[]> {
  try {
    return await apiFetch<LoyaltyReward[]>("/loyalty/catalog");
  } catch {
    return [];
  }
}

export async function getMyPoints(): Promise<number> {
  return apiFetch<number>("/loyalty/points");
}

export async function getMyRedemptions(): Promise<LoyaltyRedemption[]> {
  return apiFetch<LoyaltyRedemption[]>("/loyalty/redemptions");
}

export async function getEarnRules(): Promise<LoyaltyEarnRule[]> {
  try {
    return await apiFetch<LoyaltyEarnRule[]>("/loyalty/earn-rules");
  } catch {
    return [];
  }
}

export async function getMembershipTiers(): Promise<LoyaltyTier[]> {
  try {
    return await apiFetch<LoyaltyTier[]>("/loyalty/tiers");
  } catch {
    return [];
  }
}

export async function redeemReward(catalogId: number): Promise<LoyaltyRedemption> {
  return apiFetch<LoyaltyRedemption>("/loyalty/redeem", {
    method: "POST",
    body: JSON.stringify({ catalogId }),
  });
}
