/**
 * Backend-facing types for the storefront Product Detail integration.
 * These mirror the shapes returned by:
 *  - GET /products/:slug
 *  - GET /products/:variantId/specs
 *  - GET /products/:productId/reviews
 *  - GET /products  (used to derive related products)
 *
 * Only used inside src/services/product-detail.service.ts — the rest of the app
 * consumes the FE-facing types from src/components/product/types.ts.
 */

// ─── GET /products/:slug ────────────────────────────────────────────────────

export type BackendProductStatus = "published" | "draft" | "archived";
export type BackendVariantStatus = "visible" | "hidden";
export type BackendImageType = "main" | "gallery";

export interface BackendProductVariantImage {
  id: string;
  url: string;
  alt: string | null;
  type: BackendImageType;
  order: number;
}

export interface BackendProductVariant {
  id: string;
  sku: string;
  name: string;
  description: string;
  originalPrice: number;
  salePrice: number;
  stock: number;
  weight: number | null;
  warrantyPolicy: string | null;
  warrantyMonths: number | null;
  status: BackendVariantStatus;
  isDefault: boolean;
  images: BackendProductVariantImage[];
}

export interface BackendProductCategory {
  id: string;
  name: string;
  slug: string;
}

export interface BackendProductBrand {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
}

export interface BackendProductDetail {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  shortDescription: string | null;
  descriptionHtml: string;
  averageRating: number;
  reviewCount: number;
  status: BackendProductStatus;
  defaultVariantId: string;
  category: BackendProductCategory | null;
  brand: BackendProductBrand | null;
  brands?: BackendProductBrand[];
  variants: BackendProductVariant[];
  createdAt: string;
  updatedAt: string;
}

// ─── GET /products/:variantId/specs ─────────────────────────────────────────

export interface BackendSpecRow {
  name: string;
  value: string;
  unit: string | null;
}

export interface BackendSpecGroup {
  groupName: string;
  specs: BackendSpecRow[];
}

// ─── GET /products/:productId/reviews ───────────────────────────────────────

export interface BackendReview {
  reviewId: number;
  phienBanId: number;
  khachHangId: number;
  donHangId: number;
  rating: number;
  tieuDe: string | null;
  noiDung: string | null;
  hinhAnh?: string[];
  trangThai: string;
  daPhanHoi: boolean;
  helpfulCount: number;
  duyetTai: string | null;
  nguon: string;
  tenPhienBan?: string | null;
  skuPhienBan?: string | null;
  khachHangTen?: string | null;
  khachHangAvatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendReviewListResult {
  items: BackendReview[];
  total: number;
  page: number;
  limit: number;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

// ─── GET /products (list, used for related) ─────────────────────────────────

export interface BackendProductListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  categorySlug?: string;
  brands: string[];
  brandIds: string[];
  totalStock: number;
  status: BackendProductStatus;
  defaultVariantId: string | null;
  createdAt: string;
  updatedAt: string;
  averageRating: number | null;
  reviewCount: number;
  variants: {
    id: string;
    sku: string;
    name: string;
    price: number;
    originalPrice: number;
    stock: number;
    status: "active" | "inactive";
    thumbnailUrl: string | null;
    updatedAt: string;
    isDefault: boolean;
  }[];
}

export interface BackendProductListResult {
  data: BackendProductListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
