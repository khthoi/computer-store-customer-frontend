/**
 * Shared types for the Product Detail page and its components.
 * These supplement the component-level props types with page-level data shapes.
 */

import type { GalleryMedia } from "./hero/ProductImageGallery";
import type { StockStatus } from "./atoms/StockBadge";
import type { SpecRow } from "./tabs/SpecTable";
import type { Review } from "./reviews/ReviewCard";
import type { RatingDistribution } from "./reviews/ReviewSection";
import type { ProductCardProps } from "./card/ProductCard";

// Re-export for convenience
export type { GalleryMedia, StockStatus, SpecRow, Review, RatingDistribution };

// ─── Variant types ────────────────────────────────────────────────────────────

export interface VariantOptionData {
  value: string;
  label: string;
  stock: number;
  color?: string;
  /** Numeric delta in VND (e.g. 4000000) */
  priceDelta: number;
}

export interface VariantGroup {
  key: string;
  label: string;
  options: VariantOptionData[];
  type: "button" | "color";
}

// ─── Spec types ───────────────────────────────────────────────────────────────

export interface SpecGroup {
  heading: string;
  rows: SpecRow[];
}

// ─── Product Detail (page-level data shape) ───────────────────────────────────

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  brands: string[];
  sku: string;
  slug: string;
  currentPrice: number;
  originalPrice: number;
  discountPct: number;
  rating: number;
  reviewCount: number;
  stockStatus: StockStatus;
  stockQuantity: number;
  images: GalleryMedia[];
  variantGroups: VariantGroup[];
  specGroups: SpecGroup[];
  descriptionHtml: string;
  reviews: Review[];
  ratingDistribution: RatingDistribution;
  /** Related products shown in carousel */
  relatedProducts: ProductCardProps[];
}
