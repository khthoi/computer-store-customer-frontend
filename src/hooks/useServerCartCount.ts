"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/src/store/auth.store";
import { getMyCart, CART_CHANGED_EVENT } from "@/src/services/cart.service";

/**
 * Reads the cart-item count from the backend. The header is the single user
 * here — it refreshes on:
 *   - Mount (after auth hydration)
 *   - Auth changes (login/logout)
 *   - The `cart:changed` window event dispatched by cart.service after every
 *     mutating call. This is what makes the header increment immediately when
 *     a user clicks "Thêm vào giỏ" on a ProductCard.
 */
export function useServerCartCount(): number {
  const { state: authState } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!authState.user) {
      setCount(0);
      return;
    }
    try {
      const cart = await getMyCart();
      const total = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      setCount(total);
    } catch {
      // Keep previous count on transient errors.
    }
  }, [authState.user]);

  useEffect(() => {
    if (!authState.hydrated) return;
    fetchCount();
  }, [authState.hydrated, authState.user, fetchCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => fetchCount();
    window.addEventListener(CART_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CART_CHANGED_EVENT, handler);
  }, [fetchCount]);

  return count;
}
