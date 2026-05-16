import { storefrontApiFetch } from "@/src/services/storefront-api.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildPCSlotDef {
  id: number;
  name: string;
  slotType: string;
  isRequired: boolean;
  sortOrder: number;
  /** Max quantity allowed in this slot (e.g. 2 for dual RAM, 1 for CPU). */
  maxQuantity: number;
  categoryId: number | null;
  categorySlug: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface CompatibilityIssueDTO {
  id: string;
  ruleId: number | null;
  part1: string;
  part2: string;
  /** Variant IDs of all parts implicated — used to highlight cards regardless of name. */
  variantIds: number[];
  reason: string;
  severity: "error" | "warning";
}

export interface CompatibilityCheckResult {
  compatible: boolean;
  issues: CompatibilityIssueDTO[];
}

// ─── Backend raw shapes (Vietnamese keys from BuildSlotResponseDto) ──────────

interface RawBuildSlot {
  id: string | number;
  tenKhe: string;
  maKhe: string;
  danhMucId: number;
  danhMucTen: string;
  danhMucSlug: string;
  soLuong: number;
  batBuoc: boolean;
  thuTu: number;
  moTa?: string | null;
  isActive: boolean;
}

// ─── Slot definitions ─────────────────────────────────────────────────────────

export async function getBuildPCSlots(): Promise<BuildPCSlotDef[]> {
  const raw = await storefrontApiFetch<RawBuildSlot[]>("/build-pc/slots", {
    cache: "no-store",
  });
  return raw
    .filter((s) => Boolean(s.isActive))
    .map((s) => ({
      id: Number(s.id),
      name: s.tenKhe,
      slotType: s.maKhe,
      isRequired: Boolean(s.batBuoc),
      sortOrder: s.thuTu,
      maxQuantity: Math.max(1, Number(s.soLuong) || 1),
      categoryId: s.danhMucId ?? null,
      categorySlug: s.danhMucSlug || null,
      description: s.moTa ?? null,
      isActive: Boolean(s.isActive),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ─── Product list with full variants (Build-PC specific) ────────────────────

export interface BuildPCProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice: number;
  stock: number;
  isDefault: boolean;
  thumbnailUrl: string | null;
}

export interface BuildPCProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  thumbnail: string;
  totalStock: number;
  averageRating: number | null;
  reviewCount: number;
  variants: BuildPCProductVariant[];
  defaultVariantId: string | null;
}

interface BackendVariantRaw {
  id: string;
  sku: string;
  name: string;
  price: number | string;
  originalPrice: number | string;
  stock: number;
  status: "active" | "inactive";
  thumbnailUrl: string | null;
  isDefault: boolean;
  updatedAt: string;
}

interface BackendProductRaw {
  id: string;
  code: string;
  name: string;
  slug: string;
  brands: string[];
  totalStock: number;
  status: string;
  variants: BackendVariantRaw[];
  defaultVariantId: string | null;
  averageRating: number | null;
  reviewCount: number;
}

interface BackendListResponseRaw {
  data: BackendProductRaw[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BuildPCProductListParams {
  categoryId: number;
  page: number;
  limit: number;
  specs?: string[];
  inStock?: boolean;
}

export async function getBuildPCProductList(
  params: BuildPCProductListParams,
): Promise<{ items: BuildPCProduct[]; total: number }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  qs.set("status", "published");
  qs.set("categoryId", String(params.categoryId));
  qs.set("sortBy", "createdAt");
  qs.set("sortOrder", "DESC");
  if (params.inStock) qs.set("inStock", "true");
  if (params.specs?.length) {
    for (const s of params.specs) qs.append("specs", s);
  }

  const res = await storefrontApiFetch<BackendListResponseRaw>(
    `/products?${qs.toString()}`,
    { cache: "no-store" },
  );

  const items: BuildPCProduct[] = res.data.map((p) => {
    const variants: BuildPCProductVariant[] = (p.variants ?? [])
      .filter((v) => v.status === "active")
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        name: v.name,
        price: Number(v.price) || 0,
        originalPrice: Number(v.originalPrice) || 0,
        stock: Number(v.stock) || 0,
        isDefault: Boolean(v.isDefault),
        thumbnailUrl: v.thumbnailUrl,
      }));
    const def = variants.find((v) => v.isDefault) ?? variants[0];
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brands?.[0] ?? "",
      thumbnail: def?.thumbnailUrl ?? "",
      totalStock: Number(p.totalStock) || 0,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      variants,
      defaultVariantId: p.defaultVariantId,
    };
  });

  return { items, total: res.total };
}

// ─── Compatibility check ─────────────────────────────────────────────────────

export async function checkCompatibility(
  variantIds: number[],
  quantities?: number[],
): Promise<CompatibilityCheckResult> {
  if (variantIds.length < 2) return { compatible: true, issues: [] };
  return storefrontApiFetch<CompatibilityCheckResult>(
    "/build-pc/check-compatibility",
    {
      method: "POST",
      body: JSON.stringify({ phienBanIds: variantIds, soLuongs: quantities }),
      cache: "no-store",
    },
  );
}
