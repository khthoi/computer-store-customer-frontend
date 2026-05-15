/**
 * api.ts — Shared HTTP client for the customer storefront.
 *
 * Mirrors the admin-frontend implementation but with two differences:
 *  1. On 401 server-side: throws instead of redirecting (page-level UX decides).
 *  2. Refresh endpoint uses `credentials: "include"` so the HttpOnly
 *     `refresh_token` cookie is sent automatically.
 *
 * The backend wraps every 2xx response in:
 *   { statusCode, message, data, timestamp }
 * `apiFetch` unwraps `.data` so callers receive the inner payload directly.
 */

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const API_PREFIX = "/api";

interface ApiEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

const COOKIE_TOKEN = "auth_token";

async function getToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    return jar.get(COOKIE_TOKEN)?.value;
  }
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_TOKEN}=`))
    ?.split("=")[1];
}

/** Client-side only — call /auth/refresh to rotate access token. */
async function tryClientRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return false;
    const body = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
    const newToken = body?.data?.accessToken;
    if (!newToken) return false;
    document.cookie = `${COOKIE_TOKEN}=${encodeURIComponent(newToken)}; path=/; max-age=${15 * 60}; SameSite=Lax`;
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  _retry = false,
): Promise<T> {
  const rawToken = await getToken();
  const token = rawToken ? decodeURIComponent(rawToken) : undefined;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: options.credentials ?? "include",
    headers: {
      ...(!(options.body instanceof FormData) && { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { message?: string }).message ?? `HTTP ${res.status}`;

    if (res.status === 401 && typeof window !== "undefined" && !_retry) {
      const refreshed = await tryClientRefresh();
      if (refreshed) return apiFetch<T>(path, options, true);

      document.cookie = `${COOKIE_TOKEN}=; path=/; max-age=0; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent("session-expired"));
    }

    const error = new Error(message) as Error & { body: unknown; status: number };
    error.body = err;
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return undefined as T;

  const body = (await res.json()) as ApiEnvelope<T>;
  return body.data;
}
