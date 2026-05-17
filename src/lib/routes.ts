// ─── Centralised route constants ──────────────────────────────────────────────
//
// Import this file everywhere a href/push is needed. Never hardcode paths.
// Dynamic segments use helper functions for type safety.

export const ROUTES = {
  // ── Public storefront ────────────────────────────────────────────────────────
  home: "/",
  products: "/products",
  product: (slug: string) => `/products/${slug}`,
  compare: "/compare",
  buildPc: "/build-pc",
  cart: "/cart",
  checkout: "/checkout",
  checkoutSuccess: "/checkout/success",
  promotions: "/promotions",

  // ── Informational ─────────────────────────────────────────────────────────────
  contact: "/contact",
  faq: "/faq",
  supportTechnical: "/support/technical",

  // ── CMS-driven static pages (slug managed in admin /content/pages) ──────────
  // Slugs in DB are normalized to "info/<slug>" — URL prefix mirrors that.
  staticPage: (slug: string) => `/info/${slug.replace(/^info\//, "")}`,

  // ── Auth ─────────────────────────────────────────────────────────────────────
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",

  // ── Protected account ────────────────────────────────────────────────────────
  account: {
    root: "/account",
    profile: "/account/profile",
    addresses: "/account/addresses",
    points: "/account/points",
    orders: "/account/orders",
    order: (id: string) => `/account/orders/${id}`,
    returns: "/account/returns",
    return: (id: string) => `/account/returns/${id}`,
    wishlist: "/account/wishlist",
    notifications: "/account/notifications",
    support: "/account/support",
    ticket: (id: string) => `/account/support/${id}`,
  },
} as const;
