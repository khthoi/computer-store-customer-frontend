# CLAUDE.md — computer-store-customer-frontend
# AI entrypoint. Read this first, then the Mandatory Documents table at the bottom.

---

---

## BẮT BUỘC KHI IMPLEMENT

- Không được phép xóa toàn bộ file rồi viết lại.
- Không được phép xóa toàn bộ nội dung file rồi viết lại.
- Không được phép implement lại toàn bộ file nếu chỉ có một phần sai cần sửa.
- Chỉ sửa đúng phần bị sai hoặc phần cần bổ sung, theo hướng chỉnh sửa tối thiểu và chính xác.
- Mọi nội dung hiển thị cho người dùng phải dùng tiếng Việt có dấu.
- Comments, tên biến, tên hàm, tên kiểu dữ liệu, và code phải dùng tiếng Anh.
- Cấm sử dụng tiếng Việt không dấu trong nội dung hiển thị cho người dùng.

---

## 1. Project Overview

Repository  : computer-store-customer-frontend
Role        : Customer-facing storefront for a B2C PC hardware retailer
Paired repo : computer-store-admin-frontend (shares @computer-store/ui package)
Backend     : NestJS REST API — port 4000, JWT Bearer auth

---

## 2. System Purpose

Single-vendor e-commerce for computer hardware. One seller, many buyers.
Users: Guest (browse only) | Customer (cart, checkout, orders, reviews, support)

Core modules: Auth · Catalog · Product Detail · Build PC · Cart · Checkout ·
              Orders · Wishlist · Reviews · Support Tickets · Promotions

Screen IDs (CS-01 to CS-20) are defined in .ai/FEATURE_SPEC.md.

---

## 3. Tech Stack

Framework    : Next.js 16 — App Router, TypeScript strict mode
Styling      : TailwindCSS extending @computer-store/ui/tailwind-preset
Server state : React Query (useQuery / useMutation)
Client state : Zustand — cart.store · auth.store · buildpc.store
Auth         : NextAuth.js — JWT in httpOnly cookie
Validation   : Zod — all forms and API responses
HTTP client  : Axios — configured at src/lib/api.ts
Shared UI    : @computer-store/ui — Button, Input, Modal, Badge, Toast, Skeleton…

---

## 4. Architecture Summary

Browser → Next.js App (Presentation) → NestJS Backend (port 4000) → PostgreSQL / Redis / MinIO

Next.js layers:
  Server Components  : page data fetch, SEO metadata, static layout shells
  Client Components  : state, events, forms, cart — add "use client" ONLY when needed
  Route Handlers     : src/app/api/[...path]/route.ts — BFF proxy to NestJS

Rendering strategy:
  ISR (revalidate 3600) : Home, Catalog
  ISR (revalidate 1800) : Product detail pages
  Client-rendered       : Cart, Checkout, Build PC
  Protected (/account/) : middleware.ts validates JWT; redirects to /login?redirect=…

State decision:
  API data            → React Query cache (never Zustand)
  Transient UI state  → useState inside component
  Cross-page persist  → Zustand store

---

## 5. Routing Structure

src/app/
  (storefront)/             Public pages — Navbar + Footer layout
    page.tsx                CS-01 Home
    products/page.tsx       CS-02 Catalog  (?category=&brand=&price=&sort=&page=)
    products/[slug]/        CS-03 Product Detail  — slug only, never ID in URL
    compare/ build-pc/ cart/ checkout/ checkout/success/ promotions/
  (auth)/                   Login · Register · Forgot Password
  (account)/                Protected — profile, orders, wishlist, returns, support
  api/[...path]/            BFF Route Handlers → NestJS proxy

---

## 6. Component Strategy

Resolution order (strict — stop at first match):
  1. @computer-store/ui has it?   → import from "@computer-store/ui". STOP.
  2. src/components/ has it?      → import local. STOP.
  3. Used in 2+ pages?            → src/components/{category}/Name.tsx
  4. Page-specific?               → colocate inside the page folder

Local categories: layout/ · product/ · commerce/ · buildpc/ · reviews/ · support/

Rules:
  - "use client" only for: useState/useEffect, browser APIs, event handlers
  - Every new page: page.tsx + loading.tsx + error.tsx (all three required)
  - Every component folder: index.ts barrel export
  - Named exports only — no default exports

---

## 7. Data Fetching Rules

Pattern A — Server Component (default for most pages):
  page.tsx (Server) → calls service.ts → passes data as props to Client children

Pattern B — Client Component with React Query:
  useQuery(service.fn, queryKey) — cart, wishlist, filter-heavy pages

Pattern C — Zustand (persistent client state only):
  cartStore · authStore · buildpcStore

NEVER: fetch()/axios inside a component body | store API data in Zustand | useEffect for fetching

Locations: services → src/services/{resource}.service.ts | types → src/types/{domain}.types.ts

---

## 8. UI / Design System Rules

Full token reference: .ai/DESIGN_SYSTEM.md

Key tokens:
  CTA button   : bg-primary-600 hover:bg-primary-700 text-white rounded-lg
  Body text    : text-slate-700 | Headings: text-slate-900 | Muted: text-slate-500
  Borders      : border-slate-200 | Page bg: bg-slate-50
  Success/Warn/Error: -500 (text) / -50 (bg) / -700 (dark text)

NEVER: text-[#hex] · bg-[#hex] · style={{color:"..."}} — design tokens only
ALWAYS: formatVND() for currency | next/image with sizes | routes from src/lib/routes.ts
Responsive: mobile-first — grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

---

## 9. Development Workflow

Pre-task (every task):
  □ Read .ai/FEATURE_SPEC.md — find the screen spec (CS-XX)
  □ ls node_modules/@computer-store/ui/src/components/
  □ find src/components -name "*.tsx" | sort

Implementation order:
  1. src/types/{domain}.types.ts          (zero "any" — all types explicit)
  2. src/services/{resource}.service.ts   (API calls + error handling)
  3. src/hooks/use{Feature}.ts            (if needed)
  4. src/components/{category}/           (smallest child components first)
  5. src/app/(group)/route/page.tsx       (compose from components)
  6. src/app/(group)/route/loading.tsx    (Skeleton layout — required)

Self-review before committing:
  □ Zero TypeScript "any" | □ No hardcoded colors | □ No inline Vietnamese text
  □ loading.tsx + error.tsx present | □ Mobile responsive | □ index.ts barrel updated

---

## 10. Mandatory Documents

| Document                    | Read when                                   |
|-----------------------------|---------------------------------------------|
| .ai/CODING_RULES.md         | Every session — 10 non-negotiable rules     |
| .ai/AI_DEVELOPMENT_GUIDE.md | Every task — exact workflow + anti-patterns |
| .ai/FEATURE_SPEC.md         | Per feature — components, APIs, rules       |
| .ai/SYSTEM_ARCHITECTURE.md  | Before adding "use client" or new stores    |
| .ai/DESIGN_SYSTEM.md     | Before writing any Tailwind classes         |
| .ai/API_CONTRACT.md         | Before calling any backend endpoint         |
| .ai/COMPONENT_GUIDELINES.md | Before creating any new component           |
