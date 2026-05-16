"use client";

import { ProductCard, type ProductCardProps } from "./ProductCard";
import { ProductCardConnected } from "./ProductCardConnected";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductCardListItemsPerRow = 3 | 4 | 5 | 6;

export interface ProductCardListProps {
  /** Array of product data. Each item may include its own event handlers. */
  products: ProductCardProps[];
  /**
   * Display mode: grid layout (default) or horizontal list layout.
   * @default "grid"
   */
  viewMode?: "grid" | "list";
  /**
   * Number of product columns at the widest breakpoint (grid mode only).
   * Responsive breakpoints are applied automatically.
   * @default 4
   */
  itemsPerRow?: ProductCardListItemsPerRow;
  /**
   * Gap between cards.
   * @default "md"
   */
  gap?: "sm" | "md" | "lg";
  /**
   * Override the compare handler for every card.
   * Takes precedence over per-product `onCompare`.
   */
  onCompare?: (id: string, selectedVariants: Record<string, string>) => void;
  /**
   * Override the add-to-cart handler for every card.
   * Takes precedence over per-product `onAddToCart`.
   */
  onAddToCart?: (id: string, selectedVariants: Record<string, string>) => void;
  /**
   * Override the wishlist-toggle handler for every card.
   * Takes precedence over per-product `onWishlistToggle`.
   */
  onWishlistToggle?: (
    id: string,
    wishlisted: boolean,
    selectedVariants: Record<string, string>
  ) => void;
  /**
   * When provided, the list renders `ProductCardConnected` for each DTO so that
   * cart / wishlist / compare actions are wired automatically.
   * `products` is ignored in this mode — pass either `products` OR `dtos`.
   */
  dtos?: StorefrontProductCardDto[];
  className?: string;
}

// ─── Static grid class lookup ─────────────────────────────────────────────────
// Pre-defined strings so Tailwind can statically detect them.

const GRID_CLASSES: Record<ProductCardListItemsPerRow, string> = {
  3: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  6: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
};

const GAP_CLASSES: Record<NonNullable<ProductCardListProps["gap"]>, string> = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-5",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductCardList — renders a responsive product grid.
 *
 * ```tsx
 * // 4 items per row (default)
 * <ProductCardList products={products} onCompare={handleCompare} />
 *
 * // 5 items per row
 * <ProductCardList products={products} itemsPerRow={5} />
 * ```
 */
export function ProductCardList({
  products,
  viewMode = "grid",
  itemsPerRow = 4,
  gap = "md",
  onCompare,
  onAddToCart,
  onWishlistToggle,
  dtos,
  className = "",
}: ProductCardListProps) {
  if (dtos && dtos.length > 0) {
    const gridClass =
      gap === "md"
        ? GRID_CLASSES[itemsPerRow]
        : GRID_CLASSES[itemsPerRow].replace("gap-3", GAP_CLASSES[gap]);
    if (viewMode === "list") {
      return (
        <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
          {dtos.map((dto) => (
            <ProductCardConnected key={dto.variantId || dto.id} dto={dto} variant="list" />
          ))}
        </div>
      );
    }
    return (
      <div className={[gridClass, className].filter(Boolean).join(" ")}>
        {dtos.map((dto) => (
          <ProductCardConnected key={dto.variantId || dto.id} dto={dto} />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  const sharedHandlers = {
    onCompare,
    onAddToCart,
    onWishlistToggle,
  };

  if (viewMode === "list") {
    return (
      <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            variant="list"
            onCompare={sharedHandlers.onCompare ?? product.onCompare}
            onAddToCart={sharedHandlers.onAddToCart ?? product.onAddToCart}
            onWishlistToggle={sharedHandlers.onWishlistToggle ?? product.onWishlistToggle}
          />
        ))}
      </div>
    );
  }

  // Merge grid and gap classes, overriding the default gap-3 from GRID_CLASSES
  // when a non-default gap is requested.
  const gridClass =
    gap === "md"
      ? GRID_CLASSES[itemsPerRow]
      : GRID_CLASSES[itemsPerRow].replace("gap-3", GAP_CLASSES[gap]);

  return (
    <div className={[gridClass, className].filter(Boolean).join(" ")}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          {...product}
          onCompare={sharedHandlers.onCompare ?? product.onCompare}
          onAddToCart={sharedHandlers.onAddToCart ?? product.onAddToCart}
          onWishlistToggle={sharedHandlers.onWishlistToggle ?? product.onWishlistToggle}
        />
      ))}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name             Type                              Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * products         ProductCardProps[]                required  Product data array
 * viewMode         "grid" | "list"                   "grid"    Layout mode
 * itemsPerRow      3 | 4 | 5 | 6                     4         Max columns (grid mode only)
 * gap              "sm" | "md" | "lg"                "md"      Grid gap size
 * onCompare        (id, variants) => void            —         Shared compare handler
 * onAddToCart      (id, variants) => void            —         Shared cart handler
 * onWishlistToggle (id, wishlisted, variants) => void —        Shared wishlist handler
 * className        string                            ""        Extra classes on root div
 */
