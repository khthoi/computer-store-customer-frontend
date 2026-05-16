import { apiFetch } from "@/src/services/api";
import type {
  MySavedBuildDetail,
  MySavedBuildSummary,
} from "@/src/services/account-buildpc.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommunityBuildSortKey =
  | "newest"
  | "views"
  | "clones"
  | "price-asc"
  | "price-desc";

export interface CommunityBuildThumbnail {
  url: string;
  slotCode: string;
  slotName: string;
  /** Product slug for navigation (`/products/{slug}`) */
  productSlug: string;
  /** Variant id used as `?variant={id}` to pre-select on product page */
  variantId: number;
  productName: string;
  variantName: string;
}

export interface CommunityBuildSummary extends MySavedBuildSummary {
  authorName: string | null;
  authorAvatar: string | null;
  views: number;
  clones: number;
  /** All line-item thumbnails — priority slots (MAIN/CPU/RAM/GPU) come first. */
  thumbnails: CommunityBuildThumbnail[];
}

export interface CommunityBuildDetail extends MySavedBuildDetail {
  authorName: string | null;
  authorAvatar: string | null;
  views: number;
  clones: number;
}

export interface CommunityBuildListResult {
  data: CommunityBuildSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommunityBuildListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: CommunityBuildSortKey;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export async function listCommunityBuilds(
  params: CommunityBuildListParams = {},
): Promise<CommunityBuildListResult> {
  const { page = 1, limit, search, sortBy } = params;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  if (search) qs.set("search", search);
  if (sortBy) qs.set("sortBy", sortBy);
  return apiFetch<CommunityBuildListResult>(`/build-pc/community?${qs.toString()}`);
}

export async function getCommunityBuildDetail(id: number): Promise<CommunityBuildDetail> {
  return apiFetch<CommunityBuildDetail>(`/build-pc/community/${id}`);
}

export async function incrementCommunityBuildView(id: number): Promise<void> {
  await apiFetch<void>(`/build-pc/community/${id}/view`, { method: "POST" });
}

export async function cloneCommunityBuild(id: number): Promise<MySavedBuildSummary> {
  return apiFetch<MySavedBuildSummary>(`/build-pc/community/${id}/clone`, {
    method: "POST",
  });
}
