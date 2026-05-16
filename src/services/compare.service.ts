/**
 * compare.service.ts — Storefront /compare page integration.
 *
 * Transport layer for the comparison page. Maps backend product/spec payloads
 * into the FE-facing shapes declared in src/components/compare-ui/types.ts.
 */

import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import {
  getCategoryTreeIndex,
  resolveCategoryRoot,
} from "@/src/services/category-tree.service";
import type {
  CatalogueProduct,
  CompareBrand,
  CompareFacetGroup,
  CompareProduct,
  CompareSearchParams,
  CompareSearchResult,
  CompareSpecGroup,
  ProductVariant,
} from "@/src/components/compare-ui/types";
import type {
  BackendProductDetail,
  BackendProductVariant,
  BackendSpecGroup,
} from "@/src/types/product-detail.types";

// ─── Backend list shape (extended with originalPrice + categorySlug) ────────

interface BackendListVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  originalPrice: number;
  stock: number;
  status: "active" | "inactive";
  thumbnailUrl: string | null;
  isDefault: boolean;
  updatedAt: string;
}

interface BackendListProduct {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  brands: string[];
  brandIds: string[];
  totalStock: number;
  status: "published" | "draft" | "archived";
  variants: BackendListVariant[];
  defaultVariantId: string | null;
  averageRating: number | null;
  reviewCount: number;
}

interface BackendListResponse {
  data: BackendListProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const PLACEHOLDER_THUMBNAIL =
  "https://placehold.co/400x400/png?text=No+Image";

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function slugifyKey(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function computeDiscountPct(currentPrice: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

function pickThumbnail(...candidates: (string | null | undefined)[]): string {
  for (const c of candidates) {
    if (c && c.length > 0) return c;
  }
  return PLACEHOLDER_THUMBNAIL;
}

// ─── Mappers ───────────────────────────────────────────────────────────────

async function mapBackendProductToCatalogue(
  p: BackendListProduct,
): Promise<CatalogueProduct | null> {
  if (!p.variants.length) return null;

  const categoryId = String(p.categoryId ?? "");
  const { rootCategoryId, rootCategoryName } = await resolveCategoryRoot(
    categoryId,
    p.category,
  );

  const defaultVariant =
    p.variants.find((v) => v.isDefault) ?? p.variants[0];

  const variants: ProductVariant[] = p.variants.map((v) => ({
    value: String(v.id),
    label: v.name,
    currentPrice: Number(v.price),
    originalPrice: Number(v.originalPrice),
    isDefault: Boolean(v.isDefault),
  }));

  return {
    id: String(p.id),
    name: p.name,
    brands: (p.brands ?? []).filter((b) => b && b.trim().length > 0),
    slug: p.slug,
    categoryId,
    categoryName: p.category ?? "",
    rootCategoryId,
    rootCategoryName,
    category: rootCategoryId,
    currentPrice: Number(defaultVariant.price),
    originalPrice: Number(defaultVariant.originalPrice),
    thumbnailSrc: pickThumbnail(
      defaultVariant.thumbnailUrl,
      p.variants.find((v) => v.thumbnailUrl)?.thumbnailUrl,
    ),
    rating: p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    variants,
  };
}

function mapBackendSpecsToCompareGroups(
  groups: BackendSpecGroup[],
  variantId: string,
): CompareSpecGroup[] {
  return groups.map((g) => ({
    key: slugifyKey(g.groupName) || `group-${variantId}`,
    label: g.groupName,
    rows: g.specs.map((s) => ({
      key: slugifyKey(s.name) || `row-${variantId}`,
      label: s.name,
      values: { [variantId]: stripHtml(s.value) },
      unit: s.unit ?? undefined,
    })),
  }));
}

async function mapBackendDetailToCompareProduct(
  detail: BackendProductDetail,
  variantId: string,
  specGroups: CompareSpecGroup[],
): Promise<CompareProduct | null> {
  const variant: BackendProductVariant | undefined =
    detail.variants.find((v) => String(v.id) === String(variantId));
  if (!variant) return null;

  const categoryId = String(detail.category?.id ?? "");
  const leafName = detail.category?.name ?? "";
  const { rootCategoryId, rootCategoryName } = await resolveCategoryRoot(
    categoryId,
    leafName,
  );

  const isMultiVariant = detail.variants.length > 1;
  const currentPrice = Number(variant.salePrice);
  const originalPrice = Number(variant.originalPrice);
  const thumbnail = pickThumbnail(
    variant.images?.[0]?.url,
    detail.variants.flatMap((v) => v.images ?? [])[0]?.url,
  );

  const brandNames = (detail.brands && detail.brands.length > 0
    ? detail.brands.map((b) => b.name)
    : detail.brand
      ? [detail.brand.name]
      : []
  ).filter((n) => n && n.trim().length > 0);

  return {
    id: String(variant.id),
    name: isMultiVariant ? `${detail.name} · ${variant.name}` : detail.name,
    brands: brandNames,
    slug: detail.slug,
    categoryId,
    categoryName: leafName,
    rootCategoryId,
    rootCategoryName,
    category: rootCategoryId,
    currentPrice,
    originalPrice,
    discountPct: computeDiscountPct(currentPrice, originalPrice),
    thumbnailSrc: thumbnail,
    rating: detail.averageRating ?? 0,
    reviewCount: detail.reviewCount ?? 0,
    specGroups,
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface GetCompareCatalogueOptions {
  limit?: number;
}

async function mapManyCatalogue(items: BackendListProduct[]): Promise<CatalogueProduct[]> {
  // Pre-warm the cache once so all subsequent resolveCategoryRoot calls hit memory.
  await getCategoryTreeIndex();
  const results = await Promise.all(items.map(mapBackendProductToCatalogue));
  return results.filter((p): p is CatalogueProduct => p !== null);
}

export async function getCompareCatalogue(
  opts: GetCompareCatalogueOptions = {},
): Promise<CatalogueProduct[]> {
  const limit = opts.limit ?? 60;
  const qs = new URLSearchParams();
  qs.set("page", "1");
  qs.set("limit", String(limit));
  qs.set("status", "published");
  qs.set("sortBy", "createdAt");
  qs.set("sortOrder", "DESC");

  try {
    const response = await storefrontApiFetch<BackendListResponse>(
      `/products?${qs.toString()}`,
      { cache: "no-store" },
    );
    return mapManyCatalogue(response.data);
  } catch {
    return [];
  }
}

export async function getSuggestedProducts(
  limit = 8,
): Promise<CatalogueProduct[]> {
  const qs = new URLSearchParams();
  qs.set("page", "1");
  qs.set("limit", String(limit));
  qs.set("status", "published");
  qs.set("sortBy", "createdAt");
  qs.set("sortOrder", "DESC");

  try {
    const response = await storefrontApiFetch<BackendListResponse>(
      `/products?${qs.toString()}`,
      { cache: "no-store" },
    );
    return mapManyCatalogue(response.data);
  } catch {
    return [];
  }
}

export async function getInitialCompareVariants(
  variantIds: string[],
): Promise<CompareProduct[]> {
  if (!variantIds.length) return [];
  // MVP: variant-id-only fetch needs product slug too; not used on first paint.
  // Page passes [] for now. Reserved for ?ids=… support later.
  return [];
}

/**
 * Drawer paginated search — hits the backend products endpoint scoped to the
 * locked category (when present), with optional search/brand/price/spec filters.
 */
export async function searchCompareProducts(
  params: CompareSearchParams,
): Promise<CompareSearchResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));
  qs.set("status", "published");
  qs.set("sortBy", "createdAt");
  qs.set("sortOrder", "DESC");
  if (params.categoryId) {
    qs.set("categoryId", params.categoryId);
  } else if (params.categoryName) {
    // Fallback: backend supports `category=<vi-name>` via LIKE match.
    qs.set("category", params.categoryName);
  }
  if (params.q && params.q.trim()) qs.set("q", params.q.trim());
  if (params.brandIds && params.brandIds.length > 0) {
    for (const id of params.brandIds) qs.append("brandIds", id);
  } else if (params.brandId) {
    qs.set("brandId", params.brandId);
  }
  if (params.minPrice != null) qs.set("minPrice", String(params.minPrice));
  if (params.maxPrice != null) qs.set("maxPrice", String(params.maxPrice));

  if (params.specs) {
    for (const [typeIdStr, spec] of Object.entries(params.specs)) {
      const typeId = Number(typeIdStr);
      if (!Number.isFinite(typeId) || typeId <= 0) continue;
      if (spec.toggle) {
        qs.append("specs", `${typeId}:true`);
        continue;
      }
      if (spec.values && spec.values.length > 0) {
        qs.append("specs", `${typeId}:${spec.values.join(",")}`);
        continue;
      }
      if (spec.min != null || spec.max != null) {
        // Backend regex requires both sides; pad with safe sentinels.
        const min = spec.min != null ? spec.min : 0;
        const max = spec.max != null ? spec.max : Number.MAX_SAFE_INTEGER;
        qs.append("specs", `${typeId}:${min}..${max}`);
      }
    }
  }

  try {
    const response = await storefrontApiFetch<BackendListResponse>(
      `/products?${qs.toString()}`,
      { cache: "no-store" },
    );
    const items = await mapManyCatalogue(response.data);
    return {
      items,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages,
    };
  } catch {
    return { items: [], total: 0, page: params.page, totalPages: 0 };
  }
}

/**
 * Facet schema for the drawer's dynamic spec filters.
 * Backend returns groups → types with widget metadata + option counts.
 */
export async function getCategoryFacets(
  categoryId: string,
): Promise<CompareFacetGroup[]> {
  if (!categoryId) return [];
  try {
    const raw = await storefrontApiFetch<CompareFacetGroup[]>(
      `/specs/categories/${encodeURIComponent(categoryId)}/facets`,
      { cache: "no-store" },
    );
    // Spec values are stored as richtext in the backend; strip HTML so labels
    // render as plain text in the drawer filter (groups, facets, options).
    return raw.map((g) => ({
      ...g,
      label: stripHtml(g.label),
      types: g.types.map((t) => ({
        ...t,
        label: stripHtml(t.label),
        options: t.options?.map((o) => ({
          ...o,
          label: stripHtml(o.label),
        })),
      })),
    }));
  } catch {
    return [];
  }
}

// ─── Brand catalogue (drawer filter) ─────────────────────────────────────────

interface BackendBrandListResponse {
  data: Array<{
    id: number | string;
    name?: string;
    tenThuongHieu?: string;
    slug?: string | null;
    logo?: string | null;
    isVisible?: boolean;
  }>;
  total?: number;
}

/**
 * Fetches the visible-brand list for the drawer's multi-select filter.
 * Single request with a high limit so we can render all brands at once
 * (the storefront brand count is small — well under 200 in practice).
 */
export async function getAllBrandsForCompare(): Promise<CompareBrand[]> {
  try {
    const response = await storefrontApiFetch<BackendBrandListResponse>(
      "/brands?page=1&limit=200&active=true",
      { cache: "no-store" },
    );
    return (response.data ?? []).map((b) => ({
      id: String(b.id),
      name: String(b.name ?? b.tenThuongHieu ?? ""),
      slug: b.slug ?? null,
      logo: b.logo ?? null,
    }));
  } catch {
    return [];
  }
}

export async function getCompareVariantById(args: {
  productSlug: string;
  variantId: string;
}): Promise<CompareProduct | null> {
  const { productSlug, variantId } = args;
  if (!productSlug || !variantId) return null;

  try {
    const [detail, specs] = await Promise.all([
      storefrontApiFetch<BackendProductDetail>(
        `/products/${encodeURIComponent(productSlug)}`,
        { cache: "no-store" },
      ),
      storefrontApiFetch<BackendSpecGroup[]>(
        `/products/${encodeURIComponent(variantId)}/specs`,
        { cache: "no-store" },
      ).catch(() => [] as BackendSpecGroup[]),
    ]);

    const compareGroups = mapBackendSpecsToCompareGroups(specs, variantId);
    return await mapBackendDetailToCompareProduct(detail, variantId, compareGroups);
  } catch {
    return null;
  }
}
