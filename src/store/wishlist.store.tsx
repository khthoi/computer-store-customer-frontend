"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { useAuth } from "@/src/store/auth.store";
import { WishlistService } from "@/src/services/wishlist.service";
import type { Wishlist, WishlistItem } from "@/src/types/wishlist.types";

interface WishlistState {
  items: WishlistItem[];
  isHydrated: boolean;
  isLoading: boolean;
}

type WishlistAction =
  | { type: "HYDRATE"; payload: WishlistItem[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "ADD"; payload: WishlistItem }
  | { type: "REMOVE"; payload: number }
  | { type: "CLEAR" };

const INITIAL_STATE: WishlistState = {
  items: [],
  isHydrated: false,
  isLoading: false,
};

function reducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, items: action.payload, isHydrated: true, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "ADD": {
      if (state.items.some((i) => i.variantId === action.payload.variantId)) {
        return state;
      }
      return { ...state, items: [action.payload, ...state.items] };
    }
    case "REMOVE":
      return {
        ...state,
        items: state.items.filter((i) => i.variantId !== action.payload),
      };
    case "CLEAR":
      return { ...state, items: [], isHydrated: true };
    default:
      return state;
  }
}

export interface WishlistContextValue {
  state: WishlistState;
  count: number;
  refresh: () => Promise<void>;
  addItem: (variantId: number) => Promise<void>;
  removeItem: (variantId: number) => Promise<void>;
  hasVariant: (variantId: number) => boolean;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const refresh = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const wishlist: Wishlist = await WishlistService.getWishlist({ limit: 1000 });
      dispatch({ type: "HYDRATE", payload: wishlist.items ?? [] });
    } catch {
      dispatch({ type: "HYDRATE", payload: [] });
    }
  }, []);

  useEffect(() => {
    if (!authState.hydrated) return;
    if (authState.user) {
      void refresh();
    } else {
      dispatch({ type: "CLEAR" });
    }
  }, [authState.hydrated, authState.user, refresh]);

  const addItem = useCallback(
    async (variantId: number) => {
      if (!authState.user) return;
      const optimistic: WishlistItem = {
        id: -Date.now(),
        variantId,
        addedAt: new Date().toISOString(),
        variant: null,
      };
      dispatch({ type: "ADD", payload: optimistic });
      try {
        const saved = await WishlistService.addItem(variantId);
        dispatch({ type: "REMOVE", payload: variantId });
        dispatch({ type: "ADD", payload: saved });
      } catch {
        dispatch({ type: "REMOVE", payload: variantId });
      }
    },
    [authState.user],
  );

  const removeItem = useCallback(
    async (variantId: number) => {
      if (!authState.user) return;
      const previous = state.items;
      dispatch({ type: "REMOVE", payload: variantId });
      try {
        await WishlistService.removeItem(variantId);
      } catch {
        dispatch({ type: "HYDRATE", payload: previous });
      }
    },
    [authState.user, state.items],
  );

  const hasVariant = useCallback(
    (variantId: number) => state.items.some((i) => i.variantId === variantId),
    [state.items],
  );

  return (
    <WishlistContext.Provider
      value={{
        state,
        count: state.items.length,
        refresh,
        addItem,
        removeItem,
        hasVariant,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
