/**
 * product-detail.service.ts — Storefront product detail integration.
 *
 * 4 transport functions for the dynamic /products/[slug] route:
 *   - getProductBySlug
 *   - getVariantSpecs
 *   - getProductReviews
 *   - getRelatedProducts
 *
 * Each one calls apiFetch, then runs a private mapper that translates the
 * backend payload (Vietnamese-flavoured) into the FE-facing shapes declared in
 * src/components/product/types.ts. Mappers are NOT exported.
 */

import { createElement } from "react";
import { apiFetch } from "@/src/services/api";
import type {
  BackendProductDetail,
  BackendProductListResult,
  BackendReviewListResult,
  BackendSpecGroup,
  BackendProductVariant,
  BackendReview,
  BackendProductListItem,
} from "@/src/types/product-detail.types";
import type {
  ProductDetail,
  SpecGroup,
  VariantGroup,
  Review,
  GalleryMedia,
  RatingDistribution,
  StockStatus,
} from "@/src/components/product/types";
import type { ProductCardProps } from "@/src/components/product/ProductCard";

// ─── Public API ─────────────────────────────────────────────────────────────

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const backend = await apiFetch<BackendProductDetail>(`/products/${encodeURIComponent(slug)}`);
  assertProductHasMedia(backend);
  return mapBackendDetailToProductDetail(backend);
}

export interface ProductDetailWithMeta {
  product: ProductDetail;
  categoryId: string | null;
  defaultVariantId: string;
}

export async function getProductBySlugWithMeta(slug: string): Promise<ProductDetailWithMeta> {
  const backend = await apiFetch<BackendProductDetail>(`/products/${encodeURIComponent(slug)}`);
  assertProductHasMedia(backend);
  return {
    product: mapBackendDetailToProductDetail(backend),
    categoryId: backend.category?.id ?? null,
    defaultVariantId: backend.defaultVariantId,
  };
}

export async function getVariantSpecs(variantId: string): Promise<SpecGroup[]> {
  const groups = await apiFetch<BackendSpecGroup[]>(`/products/${encodeURIComponent(variantId)}/specs`);
  return groups.map(mapBackendSpecGroup);
}

export async function getProductReviews(
  productId: string,
  page: number,
  limit: number,
): Promise<{
  items: Review[];
  total: number;
  page: number;
  limit: number;
  distribution: RatingDistribution;
}> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
  const backend = await apiFetch<BackendReviewListResult>(
    `/products/${encodeURIComponent(productId)}/reviews?${qs.toString()}`,
  );
  return {
    items: backend.items.map(mapBackendReview),
    total: backend.total,
    page: backend.page,
    limit: backend.limit,
    distribution: mapDistribution(backend.distribution),
  };
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit: number,
): Promise<ProductCardProps[]> {
  const qs = new URLSearchParams({
    categoryId,
    page: "1",
    limit: String(limit + 1),
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const result = await apiFetch<BackendProductListResult>(`/products?${qs.toString()}`);
  return result.data
    .filter((p) => p.id !== excludeProductId)
    .map(mapBackendListItemToCard)
    .filter((card) => card.thumbnail.length > 0)
    .slice(0, limit);
}

function assertProductHasMedia(p: BackendProductDetail): void {
  const hasMedia = p.variants.some((v) => (v.images?.length ?? 0) > 0);
  if (!hasMedia) {
    const error = new Error("Không tìm thấy sản phẩm") as Error & { status: number };
    error.status = 404;
    throw error;
  }
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapBackendDetailToProductDetail(p: BackendProductDetail): ProductDetail {
  const variantById = new Map(p.variants.map((v) => [v.id, v]));
  const defaultVariant: BackendProductVariant =
    variantById.get(p.defaultVariantId) ?? p.variants[0];

  const images: GalleryMedia[] = (defaultVariant?.images ?? []).map((img, idx) => ({
    key: img.id || `img-${idx}`,
    src: img.url,
    alt: img.alt ?? p.name,
    thumbnailSrc: img.url,
  }));

  const currentPrice = defaultVariant ? defaultVariant.salePrice : 0;
  const originalPrice = defaultVariant ? defaultVariant.originalPrice : 0;
  const discountPct =
    originalPrice > 0 && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

  const variantGroups: VariantGroup[] = buildVariantGroup(p.variants, defaultVariant);

  const brandNames = (p.brands && p.brands.length > 0
    ? p.brands.map((b) => b.name)
    : p.brand
      ? [p.brand.name]
      : []
  ).filter((n) => n && n.trim().length > 0);

  return {
    id: p.id,
    name: p.name,
    brand: brandNames[0] ?? "",
    brands: brandNames,
    sku: defaultVariant?.sku ?? p.sku,
    slug: p.slug,
    currentPrice,
    originalPrice,
    discountPct,
    rating: p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    stockStatus: deriveStockStatus(defaultVariant?.stock ?? 0),
    stockQuantity: defaultVariant?.stock ?? 0,
    images,
    variantGroups,
    specGroups: [],
    descriptionHtml: defaultVariant?.description?.trim()
      ? defaultVariant.description
      : p.descriptionHtml,
    reviews: [],
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    relatedProducts: [],
  };
}

/**
 * The backend product has multiple variants where each variant is a distinct
 * SKU. The storefront's `VariantGroup` model assumes per-attribute groups (RAM,
 * SSD, ...) which our backend does not encode in normalized form yet — variant
 * options are flattened into the variant name. So we emit a single group "Phiên
 * bản" listing every variant as an option. Price delta is computed against the
 * default variant.
 */
function buildVariantGroup(
  variants: BackendProductVariant[],
  defaultVariant: BackendProductVariant | undefined,
): VariantGroup[] {
  if (!variants.length) return [];
  const basePrice = defaultVariant?.salePrice ?? variants[0].salePrice;
  return [
    {
      key: "variant",
      label: "Phiên bản",
      type: "button",
      options: variants.map((v) => ({
        value: v.id,
        label: v.name,
        stock: v.stock,
        priceDelta: v.salePrice - basePrice,
      })),
    },
  ];
}

function mapBackendSpecGroup(g: BackendSpecGroup): SpecGroup {
  return {
    heading: g.groupName,
    rows: g.specs.map((s) => ({
      label: s.name,
      value: renderSpecValue(s.value, s.unit),
    })),
  };
}

/**
 * Spec values are stored as rich-text HTML (e.g. "<p>RTX 5060 Ti</p>").
 * Render via dangerouslySetInnerHTML and use Tailwind arbitrary variants to
 * inline the block-level wrappers so they sit on the same row as the unit.
 */
function renderSpecValue(htmlValue: string, unit: string | null) {
  return createElement(
    "span",
    {
      className:
        "inline [&_p]:inline [&_p]:m-0 [&_p]:p-0 [&_ul]:inline [&_ol]:inline [&_li]:inline",
    },
    createElement("span", { dangerouslySetInnerHTML: { __html: htmlValue } }),
    unit ? createElement("span", { className: "ml-1" }, unit) : null,
  );
}

function mapBackendReview(r: BackendReview): Review {
  return {
    id: String(r.reviewId),
    authorName: r.khachHangTen ?? "Khách hàng",
    avatarUrl: r.khachHangAvatar ?? undefined,
    rating: r.rating,
    title: r.tieuDe ?? undefined,
    content: r.noiDung ?? "",
    images: [],
    purchasedVariant: r.tenPhienBan ?? undefined,
    helpfulCount: r.helpfulCount ?? 0,
    createdAt: r.createdAt,
    isVerifiedPurchase: true,
    responses: [],
  };
}

function mapDistribution(
  dist: Record<"1" | "2" | "3" | "4" | "5", number>,
): RatingDistribution {
  return {
    5: dist["5"] ?? 0,
    4: dist["4"] ?? 0,
    3: dist["3"] ?? 0,
    2: dist["2"] ?? 0,
    1: dist["1"] ?? 0,
  };
}

function mapBackendListItemToCard(p: BackendProductListItem): ProductCardProps {
  const defaultVariant =
    p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;
  const thumbnail =
    defaultVariant?.thumbnailUrl ??
    p.variants.find((v) => v.thumbnailUrl)?.thumbnailUrl ??
    "";
  return {
    id: p.id,
    name: p.name,
    brand: p.brands[0] ?? "",
    href: `/products/${p.slug}`,
    thumbnail,
    price: defaultVariant ? defaultVariant.price : 0,
    rating: p.averageRating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    stockStatus: deriveStockStatus(p.totalStock),
    stockQuantity: p.totalStock,
    productCode: defaultVariant?.sku,
  };
}

function deriveStockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= 5) return "low-stock";
  return "in-stock";
}
