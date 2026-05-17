"use client";

import { motion } from "framer-motion";
import { getStatusMeta } from "@/src/lib/orders/status-meta";
import type { OrderStatus } from "@/src/types/account-order.types";

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

/**
 * OrderStatusBadge — hero status chip shown at the top of the order detail page.
 *
 * - Renders the status icon, colored badge pill, and human-readable label.
 * - For "shipping" status: the TruckIcon has a left-to-right bounce animation.
 * - For all other statuses: icon renders statically.
 */
export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const meta = getStatusMeta(status);
  const { Icon, containerClass, textClass, iconClass, label } = meta;

  const isShipping = status === "shipping";

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold",
        containerClass,
      ].join(" ")}
    >
      {isShipping ? (
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.6,
          }}
          className={["flex shrink-0", iconClass].join(" ")}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </motion.span>
      ) : (
        <Icon className={["h-4 w-4 shrink-0", iconClass].join(" ")} aria-hidden />
      )}
      <span className={textClass}>{label}</span>
    </span>
  );
}
