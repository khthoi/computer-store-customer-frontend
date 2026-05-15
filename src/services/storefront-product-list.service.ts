import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type {
  StorefrontProductCardDto,
  StorefrontStockStatus,
} from "@/src/types/storefront-product-card.types";

export type ProductSort =
  | "bestselling"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "rating";

export interface ProductListQuery {
  q?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  /** Only products currently on sale (static markdown OR active flash sale). */
  onSale?: boolean;
  ratingMin?: number;
  sort?: ProductSort;
  page: number;
  limit: number;
  /** Facet filters. Each entry: `<specTypeId>:<v1>,<v2>` | `<specTypeId>:<min>..<max>` | `<specTypeId>:true`. */
  specs?: string[];
}

export interface ProductListResult {
  items: StorefrontProductCardDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BackendVariant {
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

interface BackendProduct {
  id: string;
  code: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string;
  brands: string[];
  brandIds: string[];
  totalStock: number;
  status: "published" | "draft" | "archived";
  variants: BackendVariant[];
  defaultVariantId: string | null;
  averageRating: number | null;
  reviewCount: number;
}

interface BackendListResponse {
  data: BackendProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function mapSort(sort: ProductSort | undefined): { sortBy: string; sortOrder: "ASC" | "DESC" } {
  switch (sort) {
    case "price-asc":
      return { sortBy: "basePrice", sortOrder: "ASC" };
    case "price-desc":
      return { sortBy: "basePrice", sortOrder: "DESC" };
    case "newest":
      return { sortBy: "createdAt", sortOrder: "DESC" };
    case "bestselling":
      return { sortBy: "totalStock", sortOrder: "DESC" };
    case "rating":
      return { sortBy: "createdAt", sortOrder: "DESC" };
    default:
      return { sortBy: "createdAt", sortOrder: "DESC" };
  }
}

function computeStockStatus(total: number): StorefrontStockStatus {
  if (total <= 0) return "out-of-stock";
  if (total <= 5) return "low-stock";
  return "in-stock";
}

function mapProduct(p: BackendProduct): StorefrontProductCardDto {
  const defaultVariant =
    p.variants.find((v) => v.isDefault) ?? p.variants[0];

  const price = defaultVariant ? Number(defaultVariant.price) : 0;
  const originalPriceRaw = defaultVariant ? Number(defaultVariant.originalPrice) : 0;
  const originalPrice = originalPriceRaw > price ? originalPriceRaw : undefined;
  const thumbnail = defaultVariant?.thumbnailUrl ?? "";

  return {
    id: p.id,
    slug: p.slug,
    variantId: defaultVariant ? Number(defaultVariant.id) : 0,
    name: p.name,
    brand: p.brands[0] ?? "",
    thumbnail,
    price,
    originalPrice,
    productCode: p.code,
    rating: p.averageRating ?? undefined,
    reviewCount: p.reviewCount,
    stockStatus: computeStockStatus(p.totalStock),
    stockQuantity: p.totalStock,
    badge: originalPrice ? "Sale" : undefined,
  };
}

export async function getProductList(
  query: ProductListQuery,
): Promise<ProductListResult> {
  const qs = new URLSearchParams();
  qs.set("page", String(query.page));
  qs.set("limit", String(query.limit));
  qs.set("status", "published");

  if (query.q) qs.set("q", query.q);
  if (query.categoryId != null) qs.set("categoryId", String(query.categoryId));
  if (query.brandId != null) qs.set("brandId", String(query.brandId));
  if (query.minPrice != null) qs.set("minPrice", String(query.minPrice));
  if (query.maxPrice != null) qs.set("maxPrice", String(query.maxPrice));
  if (query.inStock) qs.set("inStock", "true");
  if (query.onSale) qs.set("onSale", "true");
  if (query.ratingMin != null) qs.set("ratingMin", String(query.ratingMin));
  if (query.specs?.length) {
    for (const s of query.specs) qs.append("specs", s);
  }

  const { sortBy, sortOrder } = mapSort(query.sort);
  qs.set("sortBy", sortBy);
  qs.set("sortOrder", sortOrder);

  const response = await storefrontApiFetch<BackendListResponse>(
    `/products?${qs.toString()}`,
    { cache: "no-store" },
  );

  return {
    items: response.data.map(mapProduct),
    total: response.total,
    page: response.page,
    limit: response.limit,
    totalPages: response.totalPages,
  };
}
