import { apiFetch } from "@/src/services/api";
import type { Cart } from "@/src/types/cart.types";

export const CART_CHANGED_EVENT = "cart:changed";

function emitCartChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
}

export async function getMyCart(): Promise<Cart> {
  return apiFetch<Cart>("/cart");
}

export async function addCartItem(variantId: number, quantity = 1): Promise<Cart> {
  const cart = await apiFetch<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ phienBanId: variantId, soLuong: quantity }),
  });
  emitCartChanged();
  return cart;
}

export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const cart = await apiFetch<Cart>(`/cart/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify({ soLuong: quantity }),
  });
  emitCartChanged();
  return cart;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const cart = await apiFetch<Cart>(`/cart/items/${itemId}`, { method: "DELETE" });
  emitCartChanged();
  return cart;
}

export async function clearCart(): Promise<void> {
  await apiFetch<void>("/cart", { method: "DELETE" });
  emitCartChanged();
}

export async function applyCartCoupon(code: string): Promise<Cart> {
  const cart = await apiFetch<Cart>("/cart/coupon", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  emitCartChanged();
  return cart;
}

export async function removeCartCoupon(): Promise<Cart> {
  const cart = await apiFetch<Cart>("/cart/coupon", { method: "DELETE" });
  emitCartChanged();
  return cart;
}
