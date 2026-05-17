# Computer Store — Customer Storefront

The customer-facing web storefront for the **Online PC Store System**, a single-vendor B2C retailer for computers, components, and peripherals. Built with Next.js 16 App Router, TypeScript, and TailwindCSS.

## What Shoppers Can Do

### Browse & Discover
- **Home page** with hero banners, featured categories, best sellers, new arrivals, and active flash sales
- **Catalog** with filtering by category, brand, price range, specs, and stock status; sortable by price, popularity, and newest
- **Product detail** pages with image galleries, full specifications, variant selection (storage / color / configuration), stock indicator, and related products
- **Compare** up to 4 products side-by-side across specs
- **Promotions page** showing all active discounts, coupon codes, and flash sales

### Build a PC
- Step-by-step **PC builder** that guides users through choosing CPU, motherboard, RAM, GPU, storage, PSU, case, and cooling
- Compatibility validation at every step (socket, form factor, power draw, RAM type)
- Saved builds you can revisit, edit, share, or push straight to cart

### Cart & Checkout
- Persistent cart for guests and signed-in users
- Real-time price recalculation as quantities change
- Apply coupon codes, automatic promotions, and redeem loyalty points at checkout
- Address book with multiple saved shipping addresses
- Payment options: **VNPay**, **MoMo**, and **Cash on Delivery**
- Order success page with order tracking link

### Account
- Email/password sign-up + login, with password reset via email
- Profile management
- Order history with status timeline and reorder shortcut
- Wishlist
- Product reviews (only available after order delivery)
- Return / refund requests
- Support tickets with real-time replies from staff
- Loyalty point balance and earn/spend history

### Notifications
- Order status updates, support replies, and promotion alerts pushed live via Server-Sent Events when signed in

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React Server Components
- **Language:** TypeScript (strict mode)
- **Styling:** TailwindCSS
- **Server state:** React Query
- **Client state:** Zustand (cart, auth, PC builder)
- **Auth:** NextAuth.js with JWT in HttpOnly cookie
- **Forms & validation:** react-hook-form + Zod
- **HTTP:** Axios with shared `apiFetch` helper (auto refresh on 401)
- **UI primitives:** Shared `@computer-store/ui` design system

## Rendering Strategy

- **ISR (1 hour)** — Home, Catalog
- **ISR (30 min)** — Product detail pages
- **Client-rendered** — Cart, Checkout, PC Builder
- **Protected (middleware-gated)** — everything under `/account`

## Getting Started

```bash
# Install
npm install

# Environment
cp .env.example .env.local
# Set:
#   NEXT_PUBLIC_API_URL=http://localhost:4000
#   NEXT_PUBLIC_APP_URL=http://localhost:3000
#   NEXTAUTH_SECRET=<random-secret>

# Run
npm run dev
```

The storefront runs on **http://localhost:3000**. Make sure the backend (`computer-store-backend`) is running on port 4000.

## Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript compile check |

## Design System

All visual styling flows from a centralized token system (colors, spacing, typography, radii). Currency is rendered through `formatVND()`, and all routes resolve through `src/lib/routes.ts` — no hardcoded URLs or hex colors in components.

## Responsive Design

Mobile-first. Layouts scale from single-column on phones to four-column grids on large displays. All interactive elements meet touch-target guidelines on mobile.

## Browser Support

Latest two versions of Chrome, Edge, Firefox, and Safari. iOS Safari 15+ and Chrome for Android.

## License

Proprietary — internal project.
