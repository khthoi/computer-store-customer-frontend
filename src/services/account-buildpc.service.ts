import { apiFetch } from "@/src/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MySavedBuildSlot {
  slotId: number;
  slotTen: string;
  maKhe: string;
  soLuong: number;
}

export interface MySavedBuildSummary {
  id: number;
  tenBuild: string;
  moTa: string | null;
  trangThai: string;
  isPublic: boolean;
  tongGia: number;
  itemCount: number;
  slots: MySavedBuildSlot[];
  ngayTao: string;
  ngayCapNhat: string;
}

export interface AppliedFlashSale {
  flashSaleId: number;
  ten: string;
  giaFlash: number;
  ketThuc: string;
}

export interface AppliedPromotion {
  id: number;
  name: string;
  code: string | null;
  discountLabel: string | null;
  /** Numeric magnitude: 10 for 10%, 100000 for 100,000 ₫. Null when unknown. */
  discountValue: number | null;
  discountType: 'percentage' | 'fixed' | null;
}

export interface MySavedBuildItem {
  id: number;
  slotId: number;
  slotTen: string;
  maKhe: string;
  sanPhamId: number;
  sanPhamSlug: string;
  tenSanPham: string;
  danhMucId: number | null;
  danhMucTen: string;
  brands: { id: number; ten: string }[];
  phienBanId: number;
  tenPhienBan: string;
  SKU: string;
  /** Original (list) price before any discount. 0 when not set. */
  giaGoc: number;
  giaBan: number;
  /** Effective unit price after flash sale (= flashSale.giaFlash if active, else giaBan). */
  giaHienHanh: number;
  flashSale: AppliedFlashSale | null;
  appliedPromotions: AppliedPromotion[];
  hinhAnh: string | null;
  soLuong: number;
}

export interface ApplicableCoupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  /** Human-readable summary, e.g. "Giảm 10%" or "Giảm 100.000 ₫". */
  discountLabel: string;
  endDate: string;
}

export interface MySavedBuildDetail extends MySavedBuildSummary {
  chiTiet: MySavedBuildItem[];
  applicableCoupons: ApplicableCoupon[];
}

export interface SaveBuildDetailPayload {
  slotId: number;
  phienBanId: number;
  soLuong?: number;
  thuTu?: number;
}

export interface SaveBuildPayload {
  tenBuild?: string;
  moTa?: string;
  trangThai?: "draft" | "complete";
  isPublic?: boolean;
  details?: SaveBuildDetailPayload[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function getMyBuilds(): Promise<MySavedBuildSummary[]> {
  return apiFetch<MySavedBuildSummary[]>("/build-pc/saved");
}

export async function getMyBuildDetail(id: number): Promise<MySavedBuildDetail> {
  return apiFetch<MySavedBuildDetail>(`/build-pc/saved/${id}`);
}

export async function createMyBuild(payload: SaveBuildPayload): Promise<MySavedBuildSummary> {
  return apiFetch<MySavedBuildSummary>("/build-pc/saved", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMyBuild(
  id: number,
  payload: SaveBuildPayload,
): Promise<MySavedBuildSummary> {
  return apiFetch<MySavedBuildSummary>(`/build-pc/saved/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMyBuild(id: number): Promise<void> {
  await apiFetch<void>(`/build-pc/saved/${id}`, { method: "DELETE" });
}
