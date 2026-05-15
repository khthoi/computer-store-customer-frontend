"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/promotions", label: "Khuyến mãi" },
  { href: "/promotions/vouchers", label: "Mã giảm giá" },
  { href: "/promotions/rewards", label: "Đổi điểm thưởng" },
  { href: "/promotions/rules", label: "Quy tắc đổi thưởng" },
] as const;

export function PromotionsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng khuyến mãi"
      className="flex flex-wrap gap-1 border-b border-secondary-200"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-secondary-600 hover:text-secondary-900",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
