import { apiFetch } from "@/src/services/api";
import type {
  ResolutionMethod,
  ReturnReason,
  ReturnRequest,
  ReturnStatus,
} from "@/src/types/account-return.types";

const STATUS_MAP: Record<string, ReturnStatus> = {
  ChoDuyet: "submitted",
  DaDuyet: "approved",
  HoanThanh: "approved",
  DangXuLy: "processing",
  DaNhanHang: "processing",
  DaKiemTra: "processing",
  TuChoi: "rejected",
};

const REASON_MAP: Record<string, ReturnReason> = {
  LoiNhaSanXuat: "defective",
  KhongDungMoTa: "not_as_described",
  DoiYKien: "unsatisfied",
  GuiNhamHang: "wrong_item",
  HuHongKhiVanChuyen: "other",
  ThieuPhuKien: "other",
  KhongTuongThich: "other",
  HieuNangKemHon: "other",
};

const REASON_TO_BE: Record<ReturnReason, string> = {
  defective: "LoiNhaSanXuat",
  not_as_described: "KhongDungMoTa",
  unsatisfied: "DoiYKien",
  wrong_item: "GuiNhamHang",
  other: "ThieuPhuKien",
};

const RESOLUTION_MAP: Record<string, ResolutionMethod> = {
  GiaoHangMoi: "exchange",
  HoanTien: "refund",
};

interface RawReturnItem {
  variantId: string;
  productName: string;
  variantLabel: string;
  thumbnailUrl: string | null;
  quantity: number;
}

interface RawReturn {
  id: string;
  orderId: string;
  orderNumericId: number;
  status: string;
  reason: string;
  resolution: string | null;
  requestType: string;
  description: string | null;
  submittedAt: string;
  resolvedAt: string | null;
  rejectionReason: string | null;
  items: RawReturnItem[];
  evidenceUrls: string[];
}

function mapReturn(r: RawReturn): ReturnRequest {
  return {
    id: r.id,
    orderId: r.orderId,
    status: STATUS_MAP[r.status] ?? "processing",
    submittedAt: r.submittedAt,
    resolvedAt: r.resolvedAt ?? undefined,
    items: r.items.map((i) => ({
      itemId: i.variantId,
      returnQuantity: i.quantity,
    })),
    reason: REASON_MAP[r.reason] ?? "other",
    resolution: r.resolution
      ? RESOLUTION_MAP[r.resolution] ?? "refund"
      : "refund",
    description: r.description ?? "",
    evidenceUrls: r.evidenceUrls,
    rejectionReason: r.rejectionReason ?? undefined,
  };
}

export interface PaginatedReturns {
  items: ReturnRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyReturns(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedReturns> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 10));
  const raw = await apiFetch<{
    items: RawReturn[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
  }>(`/returns?${qs.toString()}`);
  const limit = raw.limit ?? params.limit ?? 10;
  return {
    items: raw.items.map(mapReturn),
    total: raw.total,
    page: raw.page,
    limit,
    totalPages: raw.totalPages ?? Math.max(1, Math.ceil(raw.total / limit)),
  };
}

export async function getMyReturnDetail(id: string): Promise<ReturnRequest> {
  const raw = await apiFetch<RawReturn>(`/returns/${id}`);
  return mapReturn(raw);
}

export interface CreateReturnInput {
  orderNumericId: number;
  reason: ReturnReason;
  resolution: ResolutionMethod;
  description: string;
  items: Array<{ variantId: number; quantity: number }>;
  /** Evidence image files. BE uploads them to Cloudinary and links the assets. */
  images?: File[];
}

export async function createReturn(
  input: CreateReturnInput,
): Promise<ReturnRequest> {
  // multipart/form-data so attached evidence files reach the backend, which
  // uploads them to Cloudinary and links the resulting media assets to the
  // request. `apiFetch` automatically omits the JSON Content-Type for FormData.
  const form = new FormData();
  form.append("orderId", String(input.orderNumericId));
  form.append("requestType", input.resolution === "exchange" ? "DoiHang" : "TraHang");
  form.append("reason", REASON_TO_BE[input.reason]);
  if (input.description) form.append("description", input.description);
  form.append("items", JSON.stringify(input.items));
  for (const f of input.images ?? []) {
    form.append("images", f, f.name);
  }
  const raw = await apiFetch<RawReturn>("/returns", {
    method: "POST",
    body: form,
  });
  return mapReturn(raw);
}
