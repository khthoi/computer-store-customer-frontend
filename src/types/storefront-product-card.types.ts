import type { ProductCardProps } from "@/src/components/product/ProductCard";
import type { VariantGroup } from "@/src/components/product/ProductVariantDrawer";
import { formatVND } from "@/src/lib/format";

export type StorefrontStockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface StorefrontVariantOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  originalPrice: number;
  stock: number;
  isDefault: boolean;
  thumbnailUrl?: string | null;
}

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
  variants: StorefrontVariantOption[];
}

const FALLBACK_THUMBNAIL = "/icons/desktop-pc.png";

function buildVariantGroup(
  variants: StorefrontVariantOption[],
): VariantGroup[] {
  if (!variants || variants.length === 0) return [];
  return [
    {
      key: "variantId",
      label: "Phiên bản",
      type: "button",
      options: variants.map((v) => ({
        value: v.id,
        label: v.name,
        stock: v.stock,
        priceDelta: formatVND(v.price),
        price: v.price,
        originalPrice: v.originalPrice,
        thumbnailUrl: v.thumbnailUrl ?? null,
        isDefault: v.isDefault,
      })),
    },
  ];
}

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
    variants: buildVariantGroup(dto.variants),
  };
}
