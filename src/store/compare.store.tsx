"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { ToastMessage } from "@/src/components/ui/Toast";
import type {
  CompareProduct,
  ProductCategory,
} from "@/src/components/compare-ui/types";

// ─── Toast ────────────────────────────────────────────────────────────────────

export interface CompareToast {
  message: string;
  type: "success" | "error";
}

// ─── State ────────────────────────────────────────────────────────────────────

interface CompareState {
  compareList: CompareProduct[];
  activeCategory: ProductCategory | null;
  isDrawerOpen: boolean;
  toast: CompareToast | null;
}

const INITIAL_STATE: CompareState = {
  compareList: [],
  activeCategory: null,
  isDrawerOpen: false,
  toast: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type CompareAction =
  | { type: "ADD_PRODUCT"; payload: CompareProduct }
  | { type: "REMOVE_PRODUCT"; payload: string }
  | { type: "UPDATE_PRODUCT"; payload: CompareProduct }
  | { type: "CLEAR_ALL" }
  | { type: "OPEN_DRAWER" }
  | { type: "CLOSE_DRAWER" }
  | { type: "SET_TOAST"; payload: CompareToast | null }
  | {
      type: "HYDRATE";
      payload: Pick<CompareState, "compareList" | "activeCategory">;
    };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function compareReducer(
  state: CompareState,
  action: CompareAction
): CompareState {
  switch (action.type) {
    case "ADD_PRODUCT": {
      const p = action.payload;
      if (state.compareList.some((x) => x.id === p.id)) return state;
      if (state.compareList.length >= 4) return state;
      if (state.activeCategory && p.category !== state.activeCategory)
        return state;
      return {
        ...state,
        compareList: [...state.compareList, p],
        activeCategory: state.activeCategory ?? p.category,
      };
    }
    case "UPDATE_PRODUCT": {
      const p = action.payload;
      const idx = state.compareList.findIndex((x) => x.id === p.id);
      if (idx === -1) return state;
      const next = state.compareList.slice();
      next[idx] = p;
      return { ...state, compareList: next };
    }
    case "REMOVE_PRODUCT": {
      const next = state.compareList.filter((p) => p.id !== action.payload);
      return {
        ...state,
        compareList: next,
        activeCategory: next.length === 0 ? null : state.activeCategory,
      };
    }
    case "CLEAR_ALL":
      return { ...state, compareList: [], activeCategory: null };
    case "OPEN_DRAWER":
      return { ...state, isDrawerOpen: true };
    case "CLOSE_DRAWER":
      return { ...state, isDrawerOpen: false };
    case "SET_TOAST":
      return { ...state, toast: action.payload };
    case "HYDRATE":
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface CompareContextValue {
  state: CompareState;
  addProduct: (product: CompareProduct) => void;
  removeProduct: (id: string) => void;
  updateProduct: (product: CompareProduct) => void;
  clearAll: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const LS_KEY = "compare_list";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CompareProvider({
  children,
  initialProducts = [],
  productCatalogue = [],
}: {
  children: ReactNode;
  /** Pre-populate on first load (used by the demo page when localStorage is empty) */
  initialProducts?: CompareProduct[];
  /**
   * Full spec-rich product list used as a lookup table.
   *
   * Problem it solves: the drawer adds products with `specGroups: []` (because
   * CatalogueProduct has no spec data). If a product is removed and then
   * re-added via the drawer, its spec data is permanently lost — even after a
   * page refresh (because the empty-specs object is also written to
   * localStorage). Passing the authoritative spec data here lets every `addProduct`
   * call and every localStorage hydration restore full spec data automatically.
   */
  productCatalogue?: CompareProduct[];
}) {
  const [state, dispatch] = useReducer(compareReducer, INITIAL_STATE);

  // Stable lookup: product ID → full CompareProduct with specGroups.
  // Stored in a ref so it never triggers re-renders and is always current.
  const catalogueMap = useRef(
    new Map(productCatalogue.map((p) => [p.id, p]))
  );

  // Hydrate from localStorage on mount; fall back to initialProducts.
  // In both paths we enrich every product from catalogueMap so that specs
  // lost from a previous remove-then-re-add cycle are silently restored.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Pick<
          CompareState,
          "compareList" | "activeCategory"
        >;
        if (Array.isArray(parsed.compareList) && parsed.compareList.length > 0) {
          const enriched = parsed.compareList.map(
            (p) => catalogueMap.current.get(p.id) ?? p
          );
          dispatch({
            type: "HYDRATE",
            payload: { ...parsed, compareList: enriched },
          });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    // Nothing in localStorage — use demo data
    if (initialProducts.length > 0) {
      dispatch({
        type: "HYDRATE",
        payload: {
          compareList: initialProducts,
          activeCategory: initialProducts[0]?.category ?? null,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — runs once on mount

  // Persist to localStorage whenever the compare list changes
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          compareList: state.compareList,
          activeCategory: state.activeCategory,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [state.compareList, state.activeCategory]);

  // ── Toast helper ──────────────────────────────────────────────────────────

  const showToast = useCallback(
    (message: string, type: CompareToast["type"]) => {
      dispatch({ type: "SET_TOAST", payload: { message, type } });
    },
    []
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const addProduct = useCallback(
    (product: CompareProduct) => {
      // Always prefer the spec-rich version from the catalogue.
      // For variant products (id = "base-id__variant-value"), if no
      // variant-specific entry exists in the catalogue, fall back to the base
      // product's spec data — remapping each spec-row values map so the
      // variant's own ID is used as the key (required for CompareTable lookup).
      const baseId = product.id.includes("__")
        ? product.id.split("__")[0]
        : product.id;
      const catalogueEntry = catalogueMap.current.get(product.id);
      const baseEntry =
        !catalogueEntry && baseId !== product.id
          ? catalogueMap.current.get(baseId)
          : null;
      const fullProduct: CompareProduct = catalogueEntry
        ? catalogueEntry
        : baseEntry
          ? {
              ...baseEntry,
              id: product.id,
              name: product.name,
              currentPrice: product.currentPrice,
              originalPrice: product.originalPrice,
              discountPct: product.discountPct,
              specGroups: baseEntry.specGroups.map((group) => ({
                ...group,
                rows: group.rows.map((row) => ({
                  ...row,
                  values: {
                    ...row.values,
                    [product.id]: row.values[baseId] ?? "",
                  },
                })),
              })),
            }
          : product;

      if (state.compareList.some((p) => p.id === fullProduct.id)) return;
      if (state.compareList.length >= 4) {
        showToast("Tối đa 4 sản phẩm", "error");
        return;
      }
      if (
        state.activeCategory &&
        fullProduct.category !== state.activeCategory
      ) {
        showToast("Chỉ có thể so sánh sản phẩm cùng loại", "error");
        return;
      }
      dispatch({ type: "ADD_PRODUCT", payload: fullProduct });
      showToast(
        `Đã thêm "${fullProduct.name.slice(0, 28)}…" vào danh sách so sánh`,
        "success"
      );
    },
    [state.compareList, state.activeCategory, showToast]
  );

  const removeProduct = useCallback((id: string) => {
    dispatch({ type: "REMOVE_PRODUCT", payload: id });
  }, []);

  const updateProduct = useCallback((product: CompareProduct) => {
    dispatch({ type: "UPDATE_PRODUCT", payload: product });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const openDrawer = useCallback(() => {
    dispatch({ type: "OPEN_DRAWER" });
  }, []);

  const closeDrawer = useCallback(() => {
    dispatch({ type: "CLOSE_DRAWER" });
  }, []);

  return (
    <CompareContext.Provider
      value={{ state, addProduct, removeProduct, updateProduct, clearAll, openDrawer, closeDrawer }}
    >
      {children}

      <ToastMessage
        isVisible={state.toast !== null}
        type={state.toast?.type ?? "success"}
        message={state.toast?.message ?? ""}
        position="top-right"
        duration={3500}
        onClose={() => dispatch({ type: "SET_TOAST", payload: null })}
      />
    </CompareContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}
