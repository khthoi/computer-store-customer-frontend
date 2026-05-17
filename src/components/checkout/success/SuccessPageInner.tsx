"use client";

import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Alert } from "@/src/components/ui/Alert";
import { ProductCarousel } from "@/src/components/product/card/ProductCarousel";
import { SuccessHero } from "./SuccessHero";
import { OrderDetailsCard } from "./OrderDetailsCard";
import type { RecommendedProduct, SuccessOrder } from "@/src/types/checkout-success.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuccessPageInnerProps {
  order: SuccessOrder;
  recommendedProducts: RecommendedProduct[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SuccessPageInner — single "use client" boundary for /checkout/success.
 *
 * Composes:
 *   SuccessHero        — animated checkmark + order ID
 *   OrderDetailsCard   — recipient, payment, items, cost breakdown
 *   Alert              — email confirmation notice
 *   Action buttons     — track order + continue shopping
 *   ProductCarousel    — recommended products
 *
 * All data is prop-drilled from the server component (page.tsx). No store or
 * provider needed — this page is stateless after render.
 */
export function SuccessPageInner({
  order,
  recommendedProducts,
}: SuccessPageInnerProps) {
  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-10">

      {/* ── Animated success hero ───────────────────────────────────────── */}
      <SuccessHero orderId={order.id} />

      {/* ── Order details card ──────────────────────────────────────────── */}
      <div className="mt-8">
        <OrderDetailsCard order={order} />
      </div>

      {/* ── Email confirmation alert ────────────────────────────────────── */}
      <div className="mt-4">
        <Alert
          variant="info"
          icon={<EnvelopeIcon className="size-5" aria-hidden="true" />}
        >
          Xác nhận đơn hàng đã được gửi đến{" "}
          <span className="font-medium">{order.customerEmail}</span>.{" "}
          Vui lòng kiểm tra hộp thư của bạn.
        </Alert>
      </div>

      {/* ── Action buttons ──────────────────────────────────────────────── */}
      {/* Tab order: copy (in SuccessHero) → track order → continue shopping */}
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href={`/account/orders/${order.numericId}`}>
          <Button variant="primary" size="md">
            Theo dõi đơn hàng
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="ghost" size="md">
            Tiếp tục mua sắm
          </Button>
        </Link>
      </div>

      {/* ── Recommended products carousel ───────────────────────────────── */}
      <section className="mt-12" aria-label="Sản phẩm gợi ý">
        <h2 className="mb-4 text-lg font-semibold text-secondary-900">
          Có thể bạn cũng thích
        </h2>
        <ProductCarousel products={recommendedProducts} itemsPerView={5} />
      </section>
    </main>
  );
}
