"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowsRightLeftIcon,
  Bars3Icon,
  ChevronDownIcon,
  CpuChipIcon,
  HeartIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { FaFacebookF, FaTiktok, FaYoutube } from "react-icons/fa";
import { SidebarMegaMenu } from "@/src/components/navigation";
import type { SidebarMenuCategory } from "@/src/components/navigation";
import { SearchBar } from "@/src/components/search/SearchBar";
import { Drawer } from "@/src/components/ui";
import { toSidebarCategories } from "@/src/services/storefront-mega-menu.service";
import type {
  FooterConfigData,
  SearchShortcutItem,
  StorefrontCategoryNode,
  StorefrontMenuItem,
  StorefrontPublicSettings,
} from "@/src/types/storefront-layout.types";
import { Navbar } from "./Navbar";

export interface HeaderUser {
  name: string;
  email?: string;
}

export interface HeaderProps {
  cartCount?: number;
  wishlistCount?: number;
  compareCount?: number;
  user?: HeaderUser | null;
  /** False until AuthProvider has read storage on mount; used to avoid flicker. */
  isAuthHydrated?: boolean;
  onLogout?: () => void;
  topLinks: StorefrontMenuItem[];
  navLinks: StorefrontMenuItem[];
  mobileLinks: StorefrontMenuItem[];
  categories: StorefrontCategoryNode[];
  searchShortcuts: SearchShortcutItem[];
  publicSettings: StorefrontPublicSettings;
  socialLinks: FooterConfigData["socialLinks"];
}

const ANNOUNCEMENTS = [
  "Miễn phí giao hàng toàn quốc cho đơn từ 500k",
  "Flash Sale linh kiện mỗi ngày",
];

const SCROLL_COMPACT = 200;
const SCROLL_RESTORE = 120;

function SocialIcons({
  publicSettings,
  socialLinks,
}: {
  publicSettings: StorefrontPublicSettings;
  socialLinks: FooterConfigData["socialLinks"];
}) {
  const iconMap = {
    facebook: { label: "Facebook", Icon: FaFacebookF },
    zalo: {
      label: "Zalo",
      Icon: ({ className }: { className?: string }) => <span className={className}>Z</span>,
    },
    tiktok: { label: "TikTok", Icon: FaTiktok },
    youtube: { label: "YouTube", Icon: FaYoutube },
  } as const;

  const publicLinkMap = new Map<string, string>([
    ["facebook", publicSettings.socialFacebook],
    ["zalo", publicSettings.socialZalo],
    ["tiktok", publicSettings.socialTiktok],
    ["youtube", publicSettings.socialYoutube],
  ]);

  const orderedLinks = socialLinks
    .map((item) => item.platform.trim().toLowerCase())
    .filter((platform): platform is keyof typeof iconMap => platform in iconMap)
    .map((platform) => ({
      platform,
      href: publicLinkMap.get(platform) || socialLinks.find((item) => item.platform.trim().toLowerCase() === platform)?.url || "",
    }))
    .filter((item) => item.href);

  const seen = new Set(orderedLinks.map((item) => item.platform));
  const fallbackPlatforms: Array<keyof typeof iconMap> = ["facebook", "zalo", "tiktok", "youtube"];
  const fallbackLinks = fallbackPlatforms
    .filter((platform) => !seen.has(platform))
    .map((platform) => ({
      platform,
      href: publicLinkMap.get(platform) || "",
    }))
    .filter((item) => item.href);

  const links = [...orderedLinks, ...fallbackLinks].map(({ platform, href }) => ({
    label: iconMap[platform].label,
    href,
    Icon: iconMap[platform].Icon,
  }));

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="hidden shrink-0 items-center gap-2 lg:flex" aria-label="Mạng xã hội">
      {links.map(({ label, href, Icon }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary-200 text-secondary-400 transition-colors hover:border-primary-300 hover:text-primary-600"
        >
          <Icon className="h-3.5 w-3.5" />
        </a>
      ))}
    </div>
  );
}

function TopBar({
  topLinks,
  user,
  isAuthHydrated,
  onLogout,
}: {
  topLinks: StorefrontMenuItem[];
  user: HeaderUser | null;
  isAuthHydrated: boolean;
  onLogout?: () => void;
}) {
  const firstName = user?.name?.split(" ").pop() ?? "";

  return (
    <div className="bg-primary-600 text-white">
      <div className="mx-auto flex h-8 max-w-[1450px] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs">
          <TruckIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{ANNOUNCEMENTS[0]}</span>
          <span className="hidden text-yellow-300 md:block">{ANNOUNCEMENTS[1]}</span>
        </div>

        <nav aria-label="Top bar links" className="flex shrink-0 items-center gap-2 text-xs">
          {topLinks.slice(0, 3).map((link, index) => (
            <span key={link.id} className="flex items-center gap-2">
              {index > 0 && <span className="text-primary-400">|</span>}
              <Link
                href={link.url}
                target={link.target === "_blank" ? "_blank" : undefined}
                rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                className="hidden text-primary-100 transition-colors hover:text-white sm:inline"
              >
                {link.label}
              </Link>
            </span>
          ))}
          <span className="text-primary-400">|</span>
          {!isAuthHydrated ? (
            <span className="h-3 w-24" aria-hidden="true" />
          ) : user ? (
            <>
              <span className="hidden text-primary-100 sm:inline cursor-pointer">
                Xin chào,{" "}
                <Link
                  href="/account/profile"
                  className="font-medium text-white transition-colors hover:text-yellow-200"
                >
                  {firstName || user.name}
                </Link>
              </span>
              <span className="text-primary-400">|</span>
              <button
                type="button"
                onClick={onLogout}
                className="text-primary-100 transition-colors hover:text-white cursor-pointer"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-primary-100 transition-colors hover:text-white cursor-pointer"
              >
                Đăng nhập
              </Link>
              <span className="text-primary-400">/</span>
              <Link
                href="/register"
                className="text-primary-100 transition-colors hover:text-white cursor-pointer"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

function CountBadge({ count, tone }: { count: number; tone: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden="true"
      className={`absolute right-0 top-0 flex h-4 w-4 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full text-[9px] font-bold text-white ${tone}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function ActionIcons({
  cartCount = 0,
  wishlistCount = 0,
  compareCount = 0,
  user = null,
  onLogout,
}: Pick<
  HeaderProps,
  "cartCount" | "wishlistCount" | "compareCount" | "user" | "onLogout"
>) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const firstName = user?.name.split(" ").pop() ?? "";

  return (
    <div className="flex shrink-0 items-center gap-5" role="toolbar" aria-label="Công cụ và tài khoản">
      <Link
        href="/build-pc"
        className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 md:flex"
      >
        <CpuChipIcon className="h-4 w-4 shrink-0" />
        Build PC
      </Link>

      <Link
        href="/compare"
        className="hidden flex-col items-center gap-0.5 text-secondary-500 transition-colors hover:text-primary-600 md:flex"
      >
        <div className="relative">
          <ArrowsRightLeftIcon className="h-5 w-5" />
          <CountBadge count={compareCount ?? 0} tone="bg-primary-500" />
        </div>
        <span className="text-[10px] font-medium leading-none">So sánh</span>
      </Link>

      <Link
        href="/wishlist"
        className="hidden flex-col items-center gap-0.5 text-secondary-500 transition-colors hover:text-primary-600 md:flex"
      >
        <div className="relative">
          <HeartIcon className="h-5 w-5" />
          <CountBadge count={wishlistCount ?? 0} tone="bg-error-500" />
        </div>
        <span className="text-[10px] font-medium leading-none">Yêu thích</span>
      </Link>

      {user ? (
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setUserMenuOpen((value) => !value)}
            className="flex flex-col items-center gap-0.5 rounded text-secondary-500 transition-colors hover:text-primary-600 cursor-pointer"
          >
            <UserIcon className="h-5 w-5" />
            <span className="max-w-[56px] truncate text-[10px] font-medium leading-none">
              {firstName}
            </span>
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-secondary-200 bg-white py-1 shadow-lg">
                <div className="border-b border-secondary-100 px-4 py-2">
                  <p className="truncate text-sm font-semibold text-secondary-800">
                    {user.name}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-secondary-400">{user.email}</p>
                  )}
                </div>
                <Link
                  href="/account/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600"
                >
                  Tài khoản của tôi
                </Link>
                <Link
                  href="/account/orders"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-primary-600"
                >
                  Đơn hàng
                </Link>
                <div className="mt-1 border-t border-secondary-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 hover:text-error-700"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="hidden flex-col items-center gap-0.5 text-secondary-500 transition-colors hover:text-primary-600 sm:flex"
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-none">Tài khoản</span>
        </Link>
      )}

      <Link
        href="/cart"
        className="hidden flex-col items-center gap-0.5 text-secondary-500 transition-colors hover:text-primary-600 md:flex"
      >
        <div className="relative">
          <ShoppingCartIcon className="h-5 w-5" />
          <CountBadge count={cartCount ?? 0} tone="bg-error-500" />
        </div>
        <span className="text-[10px] font-medium leading-none">Giỏ hàng</span>
      </Link>
    </div>
  );
}

function CompactCategoryTrigger({
  categories,
  mobileLinks,
}: {
  categories: SidebarMenuCategory[];
  mobileLinks: StorefrontMenuItem[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Mở danh mục sản phẩm"
        onClick={() => setDrawerOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:text-primary-600 lg:hidden"
      >
        <Bars3Icon className="h-4 w-4" />
      </button>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="left"
        size="md"
        title="Danh mục sản phẩm"
      >
        <div className="-mx-4 -mt-2 flex h-full flex-col overflow-hidden">
          <SidebarMegaMenu
            categories={categories}
            defaultActiveId={categories[0]?.id}
            height={680}
            className="w-full rounded-none border-0 shadow-none"
          />
          {mobileLinks.length > 0 && (
            <div className="border-t border-secondary-200 px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                Điều hướng nhanh
              </p>
              <div className="flex flex-col gap-2">
                {mobileLinks.map((link) => (
                  <Link
                    key={link.id}
                    href={link.url}
                    target={link.target === "_blank" ? "_blank" : undefined}
                    rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
                    className="text-sm font-medium text-secondary-700 transition-colors hover:text-primary-600"
                    onClick={() => setDrawerOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}

export function Header({
  cartCount = 0,
  wishlistCount = 0,
  compareCount = 0,
  user = null,
  isAuthHydrated = true,
  onLogout,
  topLinks,
  navLinks,
  mobileLinks,
  categories,
  searchShortcuts,
  publicSettings,
  socialLinks,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [compactMegaOpen, setCompactMegaOpen] = useState(false);
  const rafRef = useRef<number>(0);
  const compactCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sidebarCategories = useMemo<SidebarMenuCategory[]>(
    () => toSidebarCategories(categories),
    [categories],
  );
  const hasSocialLinks = Boolean(
    socialLinks.length > 0 ||
      publicSettings.socialFacebook ||
      publicSettings.socialZalo ||
      publicSettings.socialTiktok ||
      publicSettings.socialYoutube,
  );

  useEffect(() => {
    function onScroll() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled((prev) => {
          if (!prev && y > SCROLL_COMPACT) return true;
          if (prev && y < SCROLL_RESTORE) return false;
          return prev;
        });
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function openCompactMega() {
    if (compactCloseTimer.current) clearTimeout(compactCloseTimer.current);
    setCompactMegaOpen(true);
  }

  function closeCompactMegaDelayed() {
    compactCloseTimer.current = setTimeout(() => setCompactMegaOpen(false), 180);
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {!scrolled && (
        <TopBar
          topLinks={topLinks}
          user={user}
          isAuthHydrated={isAuthHydrated}
          onLogout={onLogout}
        />
      )}

      <div className="border-b border-secondary-200 bg-white shadow-sm">
        <div
          className={[
            "relative mx-auto flex max-w-[1450px] items-center justify-between gap-4 px-4 transition-all duration-300 ease-in-out",
            scrolled ? "h-14" : "h-16",
          ].join(" ")}
        >
          <div className="flex shrink-0 items-center gap-3">
            {scrolled && (
              <div
                className="hidden shrink-0 lg:block"
                onMouseEnter={openCompactMega}
                onMouseLeave={closeCompactMegaDelayed}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={compactMegaOpen}
                  onClick={() => setCompactMegaOpen((value) => !value)}
                  className="hidden items-center gap-2 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:flex"
                >
                  <Bars3Icon className="h-4 w-4 shrink-0" />
                  Danh mục
                  <ChevronDownIcon
                    className={`h-3.5 w-3.5 shrink-0 transition-transform ${compactMegaOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            )}
            {scrolled && (
              <CompactCategoryTrigger
                categories={sidebarCategories}
                mobileLinks={mobileLinks}
              />
            )}

            <Link
              href="/"
              aria-label="PC Store - Trang chủ"
              className="me-5 flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              {publicSettings.logoUrl ? (
                <div
                  className={[
                    "relative overflow-hidden transition-all duration-300 ease-in-out",
                    scrolled ? "h-12 w-32" : "h-16 w-40",
                  ].join(" ")}
                >
                  <Image
                    src={publicSettings.logoUrl}
                    alt={publicSettings.siteName || "PC Store"}
                    fill
                    sizes="192px"
                    className="object-contain object-right"
                  />
                </div>
              ) : (
                <div
                  className={[
                    "flex items-center justify-center rounded-lg bg-primary-600 font-extrabold tracking-tight text-white transition-all duration-300 ease-in-out",
                    scrolled ? "h-12 w-12 text-lg" : "h-16 w-16 text-xl",
                  ].join(" ")}
                >
                  PC
                </div>
              )}
            </Link>
          </div>

          <div className="flex flex-1 min-w-0">
            <SearchBar size="default" shortcutItems={searchShortcuts} />
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {!scrolled && (
              <>
                <SocialIcons publicSettings={publicSettings} socialLinks={socialLinks} />
                {hasSocialLinks && (
                  <div
                    className="hidden h-8 w-px shrink-0 bg-secondary-200 lg:block"
                    aria-hidden="true"
                  />
                )}
              </>
            )}
            <ActionIcons
              cartCount={cartCount}
              wishlistCount={wishlistCount}
              compareCount={compareCount}
              user={user}
              onLogout={onLogout}
            />
          </div>

          {scrolled && compactMegaOpen && sidebarCategories.length > 0 && (
            <div
              role="region"
              aria-label="Tất cả danh mục sản phẩm"
              className="absolute left-0 right-0 top-full z-[200] pt-2"
              onMouseEnter={openCompactMega}
              onMouseLeave={closeCompactMegaDelayed}
            >
              <SidebarMegaMenu
                categories={sidebarCategories}
                defaultActiveId={sidebarCategories[0]?.id}
                className="w-full border-secondary-200 shadow-2xl"
              />
            </div>
          )}
        </div>
      </div>

      {!scrolled && (
        <Navbar
          navLinks={navLinks}
          mobileLinks={mobileLinks}
          categories={categories}
        />
      )}
    </header>
  );
}
