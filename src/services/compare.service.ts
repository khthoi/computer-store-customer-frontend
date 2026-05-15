/**
 * compare.service.ts — Storefront /compare page integration.
 *
 * Transport layer for the comparison page. Maps backend product/spec payloads
 * into the FE-facing shapes declared in src/components/compare-ui/types.ts.
 */

import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type {
  CatalogueProduct,
  CompareProduct,
  CompareSpecGroup,
  ProductCategory,
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

// ─── Category slug → frontend ProductCategory literal ──────────────────────

const CATEGORY_SLUG_TO_FRONTEND: Record<string, ProductCategory> = {
  laptop: "laptop",
  "laptop-gaming": "laptop",
  "laptop-van-phong": "laptop",
  "laptop-do-hoa": "laptop",
  "may-tinh-ban": "pc",
  pc: "pc",
  "pc-gaming": "pc",
  "card-man-hinh": "gpu",
  "card-do-hoa": "gpu",
  gpu: "gpu",
  "cpu-bo-xu-ly": "cpu",
  "vi-xu-ly": "cpu",
  cpu: "cpu",
  "man-hinh": "monitor",
  monitor: "monitor",
  ram: "ram",
  "bo-nho-ram": "ram",
  "bo-nho-trong": "ram",
  "o-cung": "storage",
  "o-cung-ssd": "storage",
  "o-cung-hdd": "storage",
  "o-luu-tru": "storage",
  storage: "storage",
};

function mapCategorySlugToFrontend(slug: string | null | undefined): ProductCategory | null {
  if (!slug) return null;
  return CATEGORY_SLUG_TO_FRONTEND[slug] ?? null;
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

function mapBackendProductToCatalogue(
  p: BackendListProduct,
): CatalogueProduct | null {
  const category = mapCategorySlugToFrontend(p.categorySlug);
  if (!category) return null;
  if (!p.variants.length) return null;

  const defaultVariant =
    p.variants.find((v) => v.isDefault) ?? p.variants[0];

  const variants: ProductVariant[] = p.variants.map((v) => ({
    value: String(v.id),
    label: v.name,
    currentPrice: Number(v.price),
    originalPrice: Number(v.originalPrice),
  }));

  return {
    id: String(p.id),
    name: p.name,
    brands: (p.brands ?? []).filter((b) => b && b.trim().length > 0),
    slug: p.slug,
    category,
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

function mapBackendDetailToCompareProduct(
  detail: BackendProductDetail,
  variantId: string,
  specGroups: CompareSpecGroup[],
): CompareProduct | null {
  const category = mapCategorySlugToFrontend(detail.category?.slug);
  if (!category) return null;

  const variant: BackendProductVariant | undefined =
    detail.variants.find((v) => String(v.id) === String(variantId));
  if (!variant) return null;

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
    category,
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
    return response.data
      .map(mapBackendProductToCatalogue)
      .filter((p): p is CatalogueProduct => p !== null);
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
    return response.data
      .map(mapBackendProductToCatalogue)
      .filter((p): p is CatalogueProduct => p !== null);
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
    return mapBackendDetailToCompareProduct(detail, variantId, compareGroups);
  } catch {
    return null;
  }
}
