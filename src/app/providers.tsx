"use client";

/**
 * Providers — client-side context boundary.
 *
 * Wraps all client providers in a single component so that the root layout
 * (a Server Component) can stay server-rendered while still providing
 * React Context to the entire component tree.
 *
 * Order matters:
 *   AuthProvider must be outermost so all stores and UI can call useAuth().
 *   CartProvider may eventually read auth state to sync server cart on login.
 */

import type { ReactNode } from "react";
import { AuthProvider } from "@/src/store/auth.store";
import { CartProvider } from "@/src/store/cart.store";
import { WishlistProvider } from "@/src/store/wishlist.store";
import { AuthModalRoot } from "@/src/components/auth/AuthModal";
import { ToastProvider } from "@/src/components/ui/Toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <ToastProvider>
            {children}
            {/* Global auth modal — reads from AuthContext, no circular dep */}
            <AuthModalRoot />
          </ToastProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
