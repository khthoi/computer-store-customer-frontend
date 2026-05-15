"use client";

/**
 * ConnectedHeader — wires Header props from live context.
 *
 * Replaces the static <Header cartCount={2} user={null} /> in the root layout
 * with one that reads from AuthProvider and CartProvider.
 *
 * Kept thin on purpose — all actual rendering logic lives in Header.tsx.
 */

import { useAuth } from "@/src/store/auth.store";
import { useCart } from "@/src/store/cart.store";
import { useWishlist } from "@/src/store/wishlist.store";
import { useCompareCount } from "@/src/hooks/useCompareCount";
import { Header } from "./Header";
import type { StorefrontLayoutData } from "@/src/types/storefront-layout.types";

export function ConnectedHeader({ layoutData }: { layoutData: StorefrontLayoutData }) {
  const { state: authState, logout } = useAuth();
  const { state: cartState } = useCart();
  const { count: wishlistCount } = useWishlist();
  const compareCount = useCompareCount();

  const user = authState.hydrated && authState.user
    ? { name: authState.user.name, email: authState.user.email }
    : null;

  return (
    <Header
      cartCount={cartState.items.reduce((sum, i) => sum + i.quantity, 0)}
      wishlistCount={wishlistCount}
      compareCount={compareCount}
      user={user}
      isAuthHydrated={authState.hydrated}
      onLogout={logout}
      topLinks={layoutData.headerTopMenu}
      navLinks={layoutData.headerMainMenu}
      mobileLinks={layoutData.mobileMainMenu}
      categories={layoutData.categoryTree}
      searchShortcuts={layoutData.searchShortcuts}
      publicSettings={layoutData.publicSettings}
      socialLinks={layoutData.footerConfig.socialLinks}
    />
  );
}
