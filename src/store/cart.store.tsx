"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { ToastMessage } from "@/src/components/ui/Toast";
import { formatVND } from "@/src/lib/format";
import type { StockStatus } from "@/src/components/product/atoms/StockBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CouponCode {
  code: string;
  type: "percent" | "fixed";
  /** Percentage (0–100) for "percent" type; VND amount for "fixed" type. */
  value: number;
  /** Minimum billable subtotal required to redeem this coupon. */
  minOrder?: number;
}

export interface CartItem {
  /** Unique key: productId + variant fingerprint (e.g. "prod-1__ram-16gb__ssd-512gb") */
  id: string;
  productId: string;
  name: string;
  brand: string;
  thumbnailSrc: string;
  /** Product detail page path, e.g. "laptop-abc-123" */
  slug: string;
  currentPrice: number;
  originalPrice: number;
  discountPct: number;
  stockStatus: StockStatus;
  stockQuantity: number;
  quantity: number;
  /** e.g. { ram: "16gb", storage: "512gb" } */
  selectedVariants: Record<string, string>;
  /** Human-readable label, e.g. "RAM 16GB / SSD 512GB" */
  variantLabel: string;
}

interface CartToast {
  message: string;
  type: "success" | "error" | "warning";
}

interface CartState {
  items: CartItem[];
  /** IDs of checked cart rows */
  selectedIds: Set<string>;
  toast: CartToast | null;
  /** False until the localStorage useEffect has run; used to show skeleton */
  hydrated: boolean;
  appliedCoupon: CouponCode | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "REMOVE_SELECTED" }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "SELECT_ITEM"; payload: string }
  | { type: "SELECT_ALL" }
  | { type: "DESELECT_ALL" }
  | { type: "SET_TOAST"; payload: CartToast | null }
  | { type: "HYDRATE"; payload: CartItem[] }
  | { type: "APPLY_COUPON"; payload: CouponCode }
  | { type: "REMOVE_COUPON" };

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: CartState = {
  items: [],
  selectedIds: new Set(),
  toast: null,
  hydrated: false,
  appliedCoupon: null,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  quantity: Math.min(
                    i.quantity + action.payload.quantity,
                    i.stockQuantity
                  ),
                }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }

    case "REMOVE_ITEM": {
      const nextSelected = new Set(state.selectedIds);
      nextSelected.delete(action.payload);
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.payload),
        selectedIds: nextSelected,
      };
    }

    case "REMOVE_SELECTED":
      return {
        ...state,
        items: state.items.filter((i) => !state.selectedIds.has(i.id)),
        selectedIds: new Set(),
      };

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.payload.id
            ? {
                ...i,
                quantity: Math.max(
                  1,
                  Math.min(action.payload.quantity, i.stockQuantity)
                ),
              }
            : i
        ),
      };

    case "SELECT_ITEM": {
      const next = new Set(state.selectedIds);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, selectedIds: next };
    }

    case "SELECT_ALL":
      return {
        ...state,
        selectedIds: new Set(state.items.map((i) => i.id)),
      };

    case "DESELECT_ALL":
      return { ...state, selectedIds: new Set() };

    case "SET_TOAST":
      return { ...state, toast: action.payload };

    case "HYDRATE":
      return { ...state, items: action.payload, hydrated: true };

    case "APPLY_COUPON":
      return { ...state, appliedCoupon: action.payload };

    case "REMOVE_COUPON":
      return { ...state, appliedCoupon: null };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface CartContextValue {
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  removeSelected: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  showToast: (message: string, type: CartToast["type"]) => void;
  /** Returns true if the coupon was applied successfully, false otherwise. */
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const LS_KEY = "cart_items";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({
  children,
  initialItems = [],
  coupons = [],
  initialAppliedCoupon,
}: {
  children: ReactNode;
  /**
   * Pre-populate the cart when localStorage is empty.
   * Pass mock data here during development / demo pages.
   */
  initialItems?: CartItem[];
  /** Available coupon codes for this session (mock or server-fetched). */
  coupons?: CouponCode[];
  /**
   * Coupon that is pre-applied on mount (demo / server-side carry-over).
   * Only honoured in demo mode (when initialItems is provided).
   */
  initialAppliedCoupon?: CouponCode;
}) {
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);

  // Hydrate on mount.
  //
  // Demo mode  (initialItems provided): always start from initialItems,
  //   skip localStorage entirely so every page reload shows a clean slate.
  // Production mode (no initialItems): read from localStorage as before.
  useEffect(() => {
    if (initialItems.length > 0) {
      dispatch({ type: "HYDRATE", payload: initialItems });
      if (initialAppliedCoupon) {
        dispatch({ type: "APPLY_COUPON", payload: initialAppliedCoupon });
      }
      return;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "HYDRATE", payload: parsed });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    dispatch({ type: "HYDRATE", payload: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // Persist items to localStorage — only in production mode (no initialItems).
  // Demo mode mutations intentionally live in memory only.
  useEffect(() => {
    if (!state.hydrated) return;
    if (initialItems.length > 0) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state.items));
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.items, state.hydrated]);

  // ── Toast helper ──────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: CartToast["type"]) => {
      dispatch({ type: "SET_TOAST", payload: { message, type } });
    },
    []
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeItem = useCallback(
    (id: string) => {
      dispatch({ type: "REMOVE_ITEM", payload: id });
      showToast("Đã xoá sản phẩm", "success");
    },
    [showToast]
  );

  const removeSelected = useCallback(() => {
    dispatch({ type: "REMOVE_SELECTED" });
  }, []);

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      const item = state.items.find((i) => i.id === id);
      if (item && quantity > item.stockQuantity) {
        showToast(
          `Chỉ còn ${item.stockQuantity} sản phẩm trong kho`,
          "warning"
        );
      }
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
    },
    [state.items, showToast]
  );

  const toggleSelect = useCallback((id: string) => {
    dispatch({ type: "SELECT_ITEM", payload: id });
  }, []);

  const selectAll = useCallback(() => {
    dispatch({ type: "SELECT_ALL" });
  }, []);

  const deselectAll = useCallback(() => {
    dispatch({ type: "DESELECT_ALL" });
  }, []);

  const applyCoupon = useCallback(
    (code: string): boolean => {
      const found = coupons.find(
        (c) => c.code.toUpperCase() === code.trim().toUpperCase()
      );
      if (!found) {
        // Caller (CartSummary) is responsible for showing the input error.
        return false;
      }
      if (found.minOrder) {
        const billable = state.items
          .filter((i) => i.stockStatus !== "out-of-stock")
          .reduce((sum, i) => sum + i.currentPrice * i.quantity, 0);
        if (billable < found.minOrder) {
          showToast(
            `Đơn hàng tối thiểu ${formatVND(found.minOrder)} để dùng mã này`,
            "warning"
          );
          return false;
        }
      }
      dispatch({ type: "APPLY_COUPON", payload: found });
      showToast(`Áp mã giảm giá ${found.code} thành công!`, "success");
      return true;
    },
    [coupons, state.items, showToast]
  );

  const removeCoupon = useCallback(() => {
    dispatch({ type: "REMOVE_COUPON" });
  }, []);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        removeSelected,
        updateQuantity,
        toggleSelect,
        selectAll,
        deselectAll,
        showToast,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}

      <ToastMessage
        isVisible={state.toast !== null}
        type={state.toast?.type ?? "success"}
        message={state.toast?.message ?? ""}
        position="top-right"
        duration={3000}
        onClose={() => dispatch({ type: "SET_TOAST", payload: null })}
      />
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
