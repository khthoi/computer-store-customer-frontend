"use client";

import { useMemo } from "react";
import { ProductCard, type ProductCardProps } from "./ProductCard";
import { useProductCardActions } from "@/src/hooks/useProductCardActions";
import { useWishlist } from "@/src/store/wishlist.store";
import { useCompare } from "@/src/store/compare.store";
import {
  toProductCardProps,
  type StorefrontProductCardDto,
} from "@/src/types/storefront-product-card.types";

export interface ProductCardConnectedProps {
  dto: StorefrontProductCardDto;
  variant?: ProductCardProps["variant"];
  className?: string;
}

export function ProductCardConnected({
  dto,
  variant,
  className,
}: ProductCardConnectedProps) {
  const {
    handleAddToCart,
    handleWishlistToggle,
    makeCompareHandler,
  } = useProductCardActions();
  const wishlist = useWishlist();
  const compare = useCompare();

  const variantIdSet = useMemo(
    () => new Set(dto.variants.map((v) => v.id)),
    [dto.variants],
  );

  const defaultVariantId = useMemo(
    () => dto.variants.find((v) => v.isDefault)?.id ?? dto.variants[0]?.id,
    [dto.variants],
  );

  const isWishlisted = defaultVariantId
    ? wishlist.state.items.some(
        (item) => String(item.variantId) === defaultVariantId,
      )
    : false;

  // "In compare" if ANY variant of this product is currently in the compare
  // list — multi-variant products can still add more variants; the active
  // state is purely indicative.
  const isInCompare = compare.state.compareList.some((p) =>
    variantIdSet.has(p.id),
  );

  return (
    <ProductCard
      {...toProductCardProps(dto)}
      variant={variant}
      className={className}
      isWishlisted={isWishlisted}
      isInCompare={isInCompare}
      onAddToCart={handleAddToCart}
      onWishlistToggle={handleWishlistToggle}
      onCompare={makeCompareHandler(dto)}
    />
  );
}
