interface ApiEnvelope<T> {
  data: T;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

function normalizeApiBaseUrl(raw?: string): string {
  const fallback = "http://localhost:4000/api";
  const value = (raw ?? fallback).trim().replace(/\/+$/, "");
  return value.endsWith("/api") ? value : `${value}/api`;
}

function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function buildStorefrontApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function storefrontApiFetch<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } },
): Promise<T> {
  const response = await fetch(buildStorefrontApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Storefront API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as T | ApiEnvelope<T>;

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}
