import {
  ShieldCheckIcon,
  TruckIcon,
  ArrowPathIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrustBadgesRowProps {
  /**
   * Layout direction.
   * - `"horizontal"` (default) — 2-col grid on mobile, 4-col on sm+.
   * - `"vertical"` — stacked column; all badges full-width.
   */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BADGES: Array<{
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
}> = [
  { icon: ShieldCheckIcon, text: "Chính hãng 100%" },
  { icon: TruckIcon, text: "Giao hàng nhanh" },
  { icon: ArrowPathIcon, text: "Đổi trả 30 ngày" },
  { icon: PhoneIcon, text: "Hỗ trợ 24/7" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function TrustBadgesRow({
  orientation = "horizontal",
  className = "",
}: TrustBadgesRowProps) {
  const containerCls =
    orientation === "vertical"
      ? "flex flex-col gap-2"
      : "grid grid-cols-2 sm:grid-cols-4 gap-3";

  return (
    <div
      className={[
        containerCls,
        "p-3 bg-primary-50 rounded-xl border border-primary-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {BADGES.map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5">
          <Icon
            className="w-5 h-5 shrink-0 text-primary-600"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-secondary-700">{text}</span>
        </div>
      ))}
    </div>
  );
}
