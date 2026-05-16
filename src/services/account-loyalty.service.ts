import { apiFetch } from "@/src/services/api";
import type {
  EarnRule,
  MemberTier,
  PointTransaction,
  PointTransactionType,
  PointsData,
  RedemptionCatalogItem,
  RedemptionRecord,
  RedemptionStatus,
} from "@/src/types/account-loyalty.types";

interface RawTier {
  id: number;
  name: string;
  displayName: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  description: string;
  sortOrder: number;
}

interface RawTxn {
  id: number | string;
  transactionType: string;
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType: string | null;
  referenceId: number | string | null;
  createdAt: string;
}

const TIER_NAME_TO_VN: Record<string, MemberTier> = {
  Bronze: "Đồng",
  Silver: "Bạc",
  Gold: "Vàng",
  Platinum: "Bạch Kim",
  Diamond: "Bạch Kim",
};

function normalizeTierLabel(raw: RawTier): MemberTier {
  if (TIER_NAME_TO_VN[raw.name]) return TIER_NAME_TO_VN[raw.name];
  const stripped = raw.displayName.replace(/^Hạng\s+/i, "").trim();
  if (stripped === "Đồng" || stripped === "Bạc" || stripped === "Vàng" || stripped === "Bạch Kim") {
    return stripped;
  }
  return "Đồng";
}

function mapTxnType(t: string): PointTransactionType {
  if (t === "earn" || t === "redeem" || t === "expire" || t === "adjust") return t;
  if (t === "TichDiem") return "earn";
  if (t === "DoiDiem") return "redeem";
  if (t === "HetHan") return "expire";
  return "adjust";
}

function mapTxn(raw: RawTxn): PointTransaction {
  return {
    id: String(raw.id),
    type: mapTxnType(raw.transactionType),
    description: raw.description ?? "",
    points: Number(raw.points ?? 0),
    balanceAfter: Number(raw.balanceAfter ?? 0),
    createdAt: raw.createdAt,
  };
}

function computeTierStatus(
  balance: number,
  tiers: RawTier[],
): {
  tier: MemberTier;
  nextTier: MemberTier | null;
  tierProgressPercent: number;
  pointsToNextTier: number;
} {
  const sorted = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  let currentIdx = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (balance >= sorted[i].minPoints) currentIdx = i;
  }
  const current = sorted[currentIdx];
  const next = sorted[currentIdx + 1];
  const tier = current ? normalizeTierLabel(current) : "Đồng";
  if (!next) {
    return { tier, nextTier: null, tierProgressPercent: 100, pointsToNextTier: 0 };
  }
  const span = next.minPoints - current.minPoints;
  const progress = span > 0 ? Math.min(100, ((balance - current.minPoints) / span) * 100) : 0;
  return {
    tier,
    nextTier: normalizeTierLabel(next),
    tierProgressPercent: Math.round(progress),
    pointsToNextTier: Math.max(0, next.minPoints - balance),
  };
}

export interface PaginatedHistory {
  items: PointTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedRawTxn {
  items: RawTxn[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getPointsData(
  historyParams: { page?: number; limit?: number } = {},
): Promise<PointsData & { historyPage: number; historyTotalPages: number; historyTotal: number }> {
  const page = historyParams.page ?? 1;
  const limit = historyParams.limit ?? 10;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const [balance, txnResponse, tiers] = await Promise.all([
    apiFetch<number>("/loyalty/points"),
    apiFetch<PaginatedRawTxn>(`/loyalty/transactions?${qs.toString()}`),
    apiFetch<RawTier[]>("/loyalty/tiers"),
  ]);

  return {
    balance,
    ...computeTierStatus(balance, tiers),
    history: txnResponse.items.map(mapTxn),
    historyPage: txnResponse.page,
    historyTotal: txnResponse.total,
    historyTotalPages: txnResponse.totalPages,
  };
}

export async function getPointsHistory(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedHistory> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const raw = await apiFetch<PaginatedRawTxn>(`/loyalty/transactions?${qs.toString()}`);
  return {
    items: raw.items.map(mapTxn),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.totalPages,
  };
}

interface RawEarnRule {
  id: string;
  name: string;
  description: string;
  pointsPerUnit: number;
  spendPerUnit: number;
  minOrderValue: number | null;
  maxPointsPerOrder: number | null;
  bonusTrigger: string | null;
  bonusPoints: number | null;
  isActive: boolean;
}

function normalizeBonusTrigger(t: string | null): EarnRule["bonusTrigger"] {
  if (t === "first_order" || t === "birthday" || t === "manual") return t;
  return null;
}

export async function getEarnRules(): Promise<EarnRule[]> {
  const raw = await apiFetch<RawEarnRule[]>("/loyalty/earn-rules");
  return raw
    .filter((r) => r.isActive)
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? "",
      pointsPerUnit: Number(r.pointsPerUnit),
      spendPerUnit: Number(r.spendPerUnit),
      minOrderValue: r.minOrderValue != null ? Number(r.minOrderValue) : null,
      maxPointsPerOrder: r.maxPointsPerOrder != null ? Number(r.maxPointsPerOrder) : null,
      bonusTrigger: normalizeBonusTrigger(r.bonusTrigger),
      bonusPoints: r.bonusPoints != null ? Number(r.bonusPoints) : null,
    }));
}

interface RawCatalog {
  id: number;
  ten: string;
  diemCan: number;
  promotionId: number | null;
  laHoatDong: boolean;
  gioiHanTonKho: number | null;
  soDaDoi: number;
  hieuLucTu: string | null;
  hieuLucDen: string | null;
}

export async function getRedemptionCatalog(): Promise<RedemptionCatalogItem[]> {
  const raw = await apiFetch<RawCatalog[]>("/loyalty/catalog");
  return raw
    .filter((c) => c.laHoatDong)
    .map((c) => ({
      id: c.id,
      name: c.ten,
      pointsRequired: c.diemCan,
      promotionId: c.promotionId,
      stockLimit: c.gioiHanTonKho,
      redeemed: c.soDaDoi,
      validFrom: c.hieuLucTu,
      validUntil: c.hieuLucDen,
    }));
}

interface RawRedemption {
  id: number;
  catalogId: number;
  tenSnapshot: string;
  diemDaDoi: number;
  maCoupon: string;
  promotionId: number | null;
  trangThai: string;
  ngayDoi: string;
  ngaySuDung: string | null;
  donHangId: number | null;
}

function mapRedemptionStatus(s: string): RedemptionStatus {
  if (s === "completed" || s === "pending" || s === "used" || s === "expired" || s === "cancelled") {
    return s;
  }
  return "completed";
}

function mapRedemption(r: RawRedemption): RedemptionRecord {
  return {
    id: r.id,
    catalogId: r.catalogId,
    catalogName: r.tenSnapshot,
    pointsSpent: r.diemDaDoi,
    couponCode: r.maCoupon,
    status: mapRedemptionStatus(r.trangThai),
    redeemedAt: r.ngayDoi,
    usedAt: r.ngaySuDung,
    orderId: r.donHangId,
  };
}

export async function getMyRedemptions(): Promise<RedemptionRecord[]> {
  const raw = await apiFetch<RawRedemption[]>("/loyalty/redemptions");
  return raw.map(mapRedemption);
}

export interface PaginatedRedemptions {
  items: RedemptionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginatedRawRedemption {
  items: RawRedemption[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyRedemptionsPaginated(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedRedemptions> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const raw = await apiFetch<PaginatedRawRedemption>(`/loyalty/redemptions?${qs.toString()}`);
  return {
    items: raw.items.map(mapRedemption),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
    totalPages: raw.totalPages,
  };
}

export async function redeemPoints(catalogId: number): Promise<RedemptionRecord> {
  const raw = await apiFetch<RawRedemption>("/loyalty/redeem", {
    method: "POST",
    body: JSON.stringify({ catalogId }),
  });
  return {
    id: raw.id,
    catalogId: raw.catalogId,
    catalogName: raw.tenSnapshot,
    pointsSpent: raw.diemDaDoi,
    couponCode: raw.maCoupon,
    status: mapRedemptionStatus(raw.trangThai),
    redeemedAt: raw.ngayDoi,
    usedAt: raw.ngaySuDung,
    orderId: raw.donHangId,
  };
}
