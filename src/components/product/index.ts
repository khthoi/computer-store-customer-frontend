// ─── Group 3: Product ─────────────────────────────────────────────────────────

export { ProductCard } from "./card/ProductCard";
export type { ProductCardProps } from "./card/ProductCard";

export { ProductImageGallery } from "./hero/ProductImageGallery";
export type { ProductImageGalleryProps, GalleryMedia } from "./hero/ProductImageGallery";

export { PriceTag } from "./atoms/PriceTag";
export type { PriceTagProps } from "./atoms/PriceTag";

export { RatingStars } from "./atoms/RatingStars";
export type { RatingStarsProps } from "./atoms/RatingStars";

export { SpecTable } from "./tabs/SpecTable";
export type { SpecTableProps, SpecRow } from "./tabs/SpecTable";

export { VariantSelector } from "./variants/VariantSelector";
export type { VariantSelectorProps, VariantOption } from "./variants/VariantSelector";

export { StockBadge } from "./atoms/StockBadge";
export type { StockBadgeProps, StockStatus } from "./atoms/StockBadge";

export { CompareBar } from "./actions/CompareBar";
export type { CompareBarProps, CompareProduct } from "./actions/CompareBar";

export { ProductCardSkeleton } from "./card/ProductCardSkeleton";
export type { ProductCardSkeletonProps } from "./card/ProductCardSkeleton";

export { ProductCardList } from "./card/ProductCardList";
export type { ProductCardListProps, ProductCardListItemsPerRow } from "./card/ProductCardList";

// ─── Product Detail Page components ───────────────────────────────────────────

export { QuantityStepper } from "./atoms/QuantityStepper";
export type { QuantityStepperProps } from "./atoms/QuantityStepper";

export { TrustBadgesRow } from "./atoms/TrustBadgesRow";
export type { TrustBadgesRowProps } from "./atoms/TrustBadgesRow";

export { ProductActionsBar } from "./actions/ProductActionsBar";
export type { ProductActionsBarProps } from "./actions/ProductActionsBar";

export { WishlistShareBar } from "./actions/WishlistShareBar";
export type { WishlistShareBarProps } from "./actions/WishlistShareBar";

export { DescriptionTab } from "./tabs/DescriptionTab";
export type { DescriptionTabProps } from "./tabs/DescriptionTab";

export { PolicyTabContent } from "./tabs/PolicyTabContent";

export { ReviewCard } from "./reviews/ReviewCard";
export type { ReviewCardProps, Review } from "./reviews/ReviewCard";

export { ReviewFormModal } from "./reviews/ReviewFormModal";
export type { ReviewFormModalProps } from "./reviews/ReviewFormModal";

export { ReviewSection } from "./reviews/ReviewSection";
export type { ReviewSectionProps, RatingDistribution } from "./reviews/ReviewSection";

export { StickyAddToCartBar } from "./actions/StickyAddToCartBar";
export type { StickyAddToCartBarProps } from "./actions/StickyAddToCartBar";

export { RecentlyViewedSection } from "./sections/RecentlyViewedSection";
export type { RecentlyViewedSectionProps } from "./sections/RecentlyViewedSection";

export { ProductHeroClient } from "./hero/ProductHeroClient";
export type { ProductHeroClientProps } from "./hero/ProductHeroClient";

export { RatingScrollButton } from "./hero/RatingScrollButton";
export type { RatingScrollButtonProps } from "./hero/RatingScrollButton";

export { ProductHeroSection } from "./hero/ProductHeroSection";
export type { ProductHeroSectionProps } from "./hero/ProductHeroSection";

export { ProductTabsSection } from "./tabs/ProductTabsSection";
export type { ProductTabsSectionProps } from "./tabs/ProductTabsSection";

export { RelatedProductsSection } from "./sections/RelatedProductsSection";
export type { RelatedProductsSectionProps } from "./sections/RelatedProductsSection";

export type {
  ProductDetail,
  VariantGroup,
  VariantOptionData,
  SpecGroup,
} from "./types";
