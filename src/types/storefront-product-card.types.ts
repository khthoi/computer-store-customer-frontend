import type { ProductCardProps } from "@/src/components/product/ProductCard";

export type StorefrontStockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface StorefrontProductCardDto {
  id: string;
  slug: string | null;
  variantId: number;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;
  originalPrice?: number;
  productCode: string;
  rating?: number;
  reviewCount?: number;
  stockStatus: StorefrontStockStatus;
  stockQuantity?: number;
  badge?: string;
}

const FALLBACK_THUMBNAIL = "/icons/desktop-pc.png";

export function toProductCardProps(
  dto: StorefrontProductCardDto,
): Omit<ProductCardProps, "onAddToCart" | "onCompare" | "onWishlistToggle"> {
  const href = `/products/${dto.slug ?? dto.id}`;
  return {
    id: dto.id,
    name: dto.name,
    brand: dto.brand,
    href,
    thumbnail: dto.thumbnail || FALLBACK_THUMBNAIL,
    badge: dto.badge,
    productCode: dto.productCode,
    price: dto.price,
    originalPrice: dto.originalPrice,
    rating: dto.rating,
    reviewCount: dto.reviewCount,
    stockStatus: dto.stockStatus,
    stockQuantity: dto.stockQuantity,
  };
}
