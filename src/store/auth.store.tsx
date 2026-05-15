"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type { AuthModalMode, AuthUser } from "@/src/types/auth.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const LS_USER_KEY = "auth_user";
const COOKIE_TOKEN = "auth_token";
const MOJIBAKE_PATTERN = /(?:Ã.|Â.|Ä.|Å.|Æ.|Ð.|Ñ.|á[\u0080-\u00BF]|â[\u0080-\u00BF])/u;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  /** After login/register in modal, redirect to this path */
  redirectTo: string;
}

export interface AuthState {
  user: AuthUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  hydrated: boolean;
  modal: AuthModalState;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type AuthAction =
  | { type: "LOGIN"; payload: AuthUser }
  | { type: "LOGOUT" }
  | { type: "SET_STATUS"; payload: AuthState["status"] }
  | { type: "HYDRATE"; payload: AuthUser | null }
  | { type: "OPEN_MODAL"; payload: { mode: AuthModalMode; redirectTo?: string } }
  | { type: "CLOSE_MODAL" }
  | { type: "SET_MODAL_MODE"; payload: AuthModalMode };

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: AuthState = {
  user: null,
  status: "idle",
  hydrated: false,
  modal: {
    isOpen: false,
    mode: "login",
    redirectTo: "/",
  },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload,
        status: "authenticated",
        modal: { ...state.modal, isOpen: false },
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        status: "unauthenticated",
      };

    case "SET_STATUS":
      return { ...state, status: action.payload };

    case "HYDRATE":
      return {
        ...state,
        user: action.payload,
        status: action.payload ? "authenticated" : "unauthenticated",
        hydrated: true,
      };

    case "OPEN_MODAL":
      return {
        ...state,
        modal: {
          isOpen: true,
          mode: action.payload.mode,
          redirectTo: action.payload.redirectTo ?? "/",
        },
      };

    case "CLOSE_MODAL":
      return { ...state, modal: { ...state.modal, isOpen: false } };

    case "SET_MODAL_MODE":
      return { ...state, modal: { ...state.modal, mode: action.payload } };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  state: AuthState;
  /**
   * Call after a successful login/register API response.
   * Stores user in localStorage (rememberMe=true) or sessionStorage (false)
   * and sets the auth_token cookie so middleware can protect routes.
   */
  login: (user: AuthUser, accessToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  /** Open the global login/register modal. */
  openModal: (mode?: AuthModalMode, redirectTo?: string) => void;
  closeModal: () => void;
  setModalMode: (mode: AuthModalMode) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Storage helpers ──────────────────────────────────────────────────────────

function normalizePossiblyMojibakeText(value: string): string {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("\uFFFD") ? value : decoded;
  } catch {
    return value;
  }
}

function normalizeAuthUser(user: AuthUser): AuthUser {
  return {
    ...user,
    name: normalizePossiblyMojibakeText(user.name),
  };
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LS_USER_KEY) ?? sessionStorage.getItem(LS_USER_KEY);
    if (raw) return normalizeAuthUser(JSON.parse(raw) as AuthUser);
  } catch {}
  return null;
}

function writeUser(user: AuthUser, rememberMe: boolean): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  try {
    storage.setItem(LS_USER_KEY, JSON.stringify(normalizeAuthUser(user)));
    // Also clear the other storage so there's no stale data
    if (rememberMe) sessionStorage.removeItem(LS_USER_KEY);
    else localStorage.removeItem(LS_USER_KEY);
  } catch {}
}

function clearUser(): void {
  try {
    localStorage.removeItem(LS_USER_KEY);
    sessionStorage.removeItem(LS_USER_KEY);
  } catch {}
}

function setCookie(name: string, value: string, maxAge?: number): void {
  const expiry = maxAge !== undefined ? `; max-age=${maxAge}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/${expiry}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_STATE);

  // Hydrate from storage on mount
  useEffect(() => {
    const stored = readStoredUser();
    dispatch({ type: "HYDRATE", payload: stored });
  }, []); // intentionally empty — runs once on mount

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    (user: AuthUser, accessToken: string, rememberMe = false) => {
      const normalizedUser = normalizeAuthUser(user);
      writeUser(normalizedUser, rememberMe);
      const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
      setCookie(COOKIE_TOKEN, accessToken, maxAge);
      dispatch({ type: "LOGIN", payload: normalizedUser });
    },
    []
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    clearUser();
    clearCookie(COOKIE_TOKEN);
    dispatch({ type: "LOGOUT" });
  }, []);

  // ── Modal ──────────────────────────────────────────────────────────────────

  const openModal = useCallback(
    (mode: AuthModalMode = "login", redirectTo = "/") => {
      dispatch({ type: "OPEN_MODAL", payload: { mode, redirectTo } });
    },
    []
  );

  const closeModal = useCallback(() => {
    dispatch({ type: "CLOSE_MODAL" });
  }, []);

  const setModalMode = useCallback((mode: AuthModalMode) => {
    dispatch({ type: "SET_MODAL_MODE", payload: mode });
  }, []);

  return (
    <AuthContext.Provider
      value={{ state, login, logout, openModal, closeModal, setModalMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
