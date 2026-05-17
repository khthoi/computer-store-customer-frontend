"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UserIcon,
  MapPinIcon,
  StarIcon,
  ShoppingBagIcon,
  HeartIcon,
  ArrowUturnLeftIcon,
  ChatBubbleLeftRightIcon,
  WrenchScrewdriverIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import {
  UserIcon as UserIconSolid,
  MapPinIcon as MapPinIconSolid,
  StarIcon as StarIconSolid,
  ShoppingBagIcon as ShoppingBagIconSolid,
  HeartIcon as HeartIconSolid,
  ArrowUturnLeftIcon as ArrowUturnLeftIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  BellIcon as BellIconSolid,
} from "@heroicons/react/24/solid";
import { Avatar } from "@/src/components/ui/Avatar";
import { Tabs } from "@/src/components/ui/Tabs";
import type { TabItem } from "@/src/components/ui/Tabs";

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  tabValue: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/account/profile",
    label: "Hồ sơ",
    tabValue: "profile",
    icon: <UserIcon className="h-5 w-5" />,
    iconActive: <UserIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/addresses",
    label: "Địa chỉ",
    tabValue: "addresses",
    icon: <MapPinIcon className="h-5 w-5" />,
    iconActive: <MapPinIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/points",
    label: "Điểm thưởng",
    tabValue: "points",
    icon: <StarIcon className="h-5 w-5" />,
    iconActive: <StarIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/orders",
    label: "Đơn hàng",
    tabValue: "orders",
    icon: <ShoppingBagIcon className="h-5 w-5" />,
    iconActive: <ShoppingBagIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/notifications",
    label: "Thông báo",
    tabValue: "notifications",
    icon: <BellIcon className="h-5 w-5" />,
    iconActive: <BellIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/returns",
    label: "Đổi/Trả hàng",
    tabValue: "returns",
    icon: <ArrowUturnLeftIcon className="h-5 w-5" />,
    iconActive: <ArrowUturnLeftIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/wishlist",
    label: "Yêu thích",
    tabValue: "wishlist",
    icon: <HeartIcon className="h-5 w-5" />,
    iconActive: <HeartIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/build-pc",
    label: "Cấu hình PC",
    tabValue: "build-pc",
    icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
    iconActive: <WrenchScrewdriverIconSolid className="h-5 w-5" />,
  },
  {
    href: "/account/support",
    label: "Hỗ trợ",
    tabValue: "support",
    icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    iconActive: <ChatBubbleLeftRightIconSolid className="h-5 w-5" />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AccountSidebar — vertical nav on desktop, horizontal pill Tabs on mobile.
 *
 * - Desktop (lg+): 240px fixed sidebar with nav links + user avatar.
 * - Mobile (<lg): pill Tabs rendered across the top of the content area.
 */
export interface AccountSidebarProps {
  userName: string;
  tierLabel: string;
  avatarSrc?: string;
}

export function AccountSidebar({ userName, tierLabel, avatarSrc }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive active tab value from the current pathname segment
  const activeTab =
    NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.tabValue ??
    "profile";

  const mobileTabs: TabItem[] = NAV_ITEMS.map((item) => ({
    value: item.tabValue,
    label: item.label,
    icon:
      activeTab === item.tabValue ? item.iconActive : item.icon,
  }));

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:gap-2 lg:shrink-0">
        {/* User card */}
        <div className="mb-2 flex items-center gap-3 rounded-2xl border border-secondary-200 bg-white px-4 py-4">
          <Avatar name={userName} src={avatarSrc} size="xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-secondary-900">
              {userName}
            </p>
            <p className="truncate text-xs text-secondary-400">
              {tierLabel}
            </p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="rounded-2xl border border-secondary-200 bg-white overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors duration-150",
                  "border-b border-secondary-100 last:border-b-0",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900",
                ].join(" ")}
              >
                <span
                  className={[
                    "shrink-0",
                    isActive ? "text-primary-600" : "text-secondary-400",
                  ].join(" ")}
                >
                  {isActive ? item.iconActive : item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ── Mobile tab bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden">
        <Tabs
          tabs={mobileTabs}
          value={activeTab}
          variant="pill"
          onChange={(val) => {
            const item = NAV_ITEMS.find((n) => n.tabValue === val);
            if (item) router.push(item.href);
          }}
        >
          {/* No TabPanels — navigation handled by router.push */}
          <span />
        </Tabs>
      </div>
    </>
  );
}
