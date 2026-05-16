"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bars3Icon,
  ChevronDownIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { SidebarMegaMenu } from "@/src/components/navigation";
import type { SidebarMenuCategory } from "@/src/components/navigation";
import { Drawer } from "@/src/components/ui";
import { toSidebarCategories } from "@/src/services/storefront-mega-menu.service";
import type {
  StorefrontCategoryNode,
  StorefrontMenuItem,
} from "@/src/types/storefront-layout.types";

export interface NavbarProps {
  navLinks: StorefrontMenuItem[];
  mobileLinks: StorefrontMenuItem[];
  categories: StorefrontCategoryNode[];
}

function extractNavBadge(label: string): {
  cleanLabel: string;
  badge: "HOT" | "SALE" | "NEW" | null;
} {
  const trimmed = label.trim();
  const badgeMatch = trimmed.match(/\b(HOT|SALE|NEW)\b/i);

  if (!badgeMatch) {
    return { cleanLabel: trimmed, badge: null };
  }

  return {
    cleanLabel: trimmed.replace(badgeMatch[0], "").replace(/\s{2,}/g, " ").trim(),
    badge: badgeMatch[0].toUpperCase() as "HOT" | "SALE" | "NEW",
  };
}

export function Navbar({ navLinks, mobileLinks, categories }: NavbarProps) {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const megaContainerRef = useRef<HTMLDivElement | null>(null);
  const quickLinksViewportRef = useRef<HTMLDivElement | null>(null);
  const quickLinksTrackRef = useRef<HTMLDivElement | null>(null);

  const sidebarCategories = useMemo<SidebarMenuCategory[]>(
    () => toSidebarCategories(categories),
    [categories],
  );
  const navMarqueeDuration = useMemo(() => {
    const itemCount = Math.max(navLinks.length, 1);
    return Math.max(itemCount * 5.5, 28);
  }, [navLinks.length]);

  function renderNavLink(link: StorefrontMenuItem, isDuplicate = false) {
    const isActive =
      pathname === link.url || pathname.startsWith(`${link.url}/`);
    const { cleanLabel, badge } = extractNavBadge(link.label);
    const isProminent =
      badge !== null || /khuyen mai/i.test(link.label);

    return (
      <Link
        key={`${link.id}-${isDuplicate ? "dup" : "main"}`}
        href={link.url}
        target={link.target === "_blank" ? "_blank" : undefined}
        rel={link.target === "_blank" ? "noopener noreferrer" : undefined}
        aria-current={!isDuplicate && isActive ? "page" : undefined}
        aria-hidden={isDuplicate ? "true" : undefined}
        tabIndex={isDuplicate ? -1 : undefined}
        className={[
          "inline-flex shrink-0 items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-medium tracking-normal transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
          isActive
            ? "border-primary-600 text-primary-600"
            : isProminent
              ? "text-primary-600 hover:border-primary-600 hover:text-primary-700"
              : "text-secondary-600 hover:border-primary-600 hover:text-primary-600",
        ].join(" ")}
      >
        <span>{cleanLabel}</span>
        {badge && (
          <span
            className={[
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none",
              badge === "HOT"
                ? "bg-error-500 text-white"
                : badge === "SALE"
                  ? "bg-warning-500 text-secondary-950"
                  : "bg-primary-500 text-white",
            ].join(" ")}
          >
            {badge}
          </span>
        )}
        {!badge && isProminent && (
          <span className="inline-flex items-center rounded-full bg-warning-100 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-warning-700">
            Sale
          </span>
        )}
      </Link>
    );
  }

  // Close on outside click + Escape — click-toggle is the only way to open/close.
  useEffect(() => {
    if (!megaOpen) return;
    function handleMouseDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      const container = megaContainerRef.current;
      if (container && container.contains(target)) return;
      // Mega panel renders outside the trigger container — check via data-attr.
      if (
        target instanceof Element &&
        target.closest('[data-mega-panel="navbar"]')
      ) {
        return;
      }
      setMegaOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMegaOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [megaOpen]);

  // Close mega menu on route change
  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  useEffect(() => {
    const viewport = quickLinksViewportRef.current;
    const track = quickLinksTrackRef.current;

    if (!viewport || !track) {
      return;
    }

    const updateOverflowState = () => {
      setShouldMarquee(track.scrollWidth > viewport.clientWidth + 8);
    };

    updateOverflowState();

    const observer = new ResizeObserver(() => {
      updateOverflowState();
    });

    observer.observe(viewport);
    observer.observe(track);
    window.addEventListener("resize", updateOverflowState);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateOverflowState);
    };
  }, [navLinks]);

  return (
    <>
      <nav aria-label="Category navigation" className="border-b border-secondary-200 bg-white">
        <div className="relative mx-auto max-w-[1400px] px-4">
          <div className="flex h-12 items-center gap-0">
            <button
              type="button"
              aria-label="Mở danh mục sản phẩm"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 lg:hidden"
            >
              <Bars3Icon className="h-4 w-4" />
              <span>Danh mục</span>
            </button>

            <div ref={megaContainerRef} className="hidden shrink-0 lg:block">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={megaOpen}
                onClick={() => setMegaOpen((value) => !value)}
                className={[
                  "flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400",
                  megaOpen
                    ? "border-primary-300 text-primary-600"
                    : "border-secondary-200 text-secondary-700 hover:text-primary-600",
                ].join(" ")}
              >
                <Bars3Icon className="h-4 w-4 shrink-0" />
                Danh mục
                <ChevronDownIcon
                  className={[
                    "h-3.5 w-3.5 shrink-0 transition-transform duration-150",
                    megaOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            </div>

            <div
              className="mx-4 hidden h-5 w-px shrink-0 bg-secondary-200 lg:block"
              aria-hidden="true"
            />

            <div
              ref={quickLinksViewportRef}
              className="hidden min-w-0 flex-1 overflow-hidden lg:block"
            >
              <div
                className="group relative overflow-hidden"
                aria-label="Liên kết nhanh"
                onMouseEnter={() => setIsMarqueePaused(true)}
                onMouseLeave={() => setIsMarqueePaused(false)}
                onFocusCapture={() => setIsMarqueePaused(true)}
                onBlurCapture={() => setIsMarqueePaused(false)}
              >
                <div
                  ref={quickLinksTrackRef}
                  className="flex min-w-max flex-nowrap items-center gap-6 whitespace-nowrap"
                  style={shouldMarquee ? {
                    animation: `navbar-marquee ${navMarqueeDuration}s linear infinite`,
                    animationPlayState: isMarqueePaused ? "paused" : "running",
                  } : undefined}
                >
                  {navLinks.map((link) => renderNavLink(link))}
                  {shouldMarquee && navLinks.length > 0
                    ? navLinks.map((link) => renderNavLink(link, true))
                    : null}
                </div>
              </div>
            </div>

            {/* Community Build PC — plain text link on the right of the nav slider */}
            <Link
              href="/community/builds"
              aria-current={
                pathname === "/community/builds" ||
                pathname.startsWith("/community/builds/")
                  ? "page"
                  : undefined
              }
              className={[
                "ml-6 hidden shrink-0 items-center gap-1.5 border-b-2 border-transparent pb-0.5 text-sm font-medium transition-colors focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-300 lg:inline-flex",
                pathname === "/community/builds" ||
                pathname.startsWith("/community/builds/")
                  ? "border-primary-600 text-primary-600"
                  : "text-secondary-600 hover:border-primary-600 hover:text-primary-600",
              ].join(" ")}
            >
              <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Cộng đồng Build PC</span>
            </Link>
          </div>

          {megaOpen && sidebarCategories.length > 0 && (
            <div
              role="region"
              aria-label="Tất cả danh mục sản phẩm"
              data-mega-panel="navbar"
              className="absolute left-0 right-0 top-full z-[200] pt-2"
            >
              <SidebarMegaMenu
                categories={sidebarCategories}
                defaultActiveId={sidebarCategories[0]?.id}
                className="w-full border-secondary-200 shadow-2xl"
              />
            </div>
          )}
        </div>
      </nav>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="left"
        size="md"
        title="Danh mục sản phẩm"
      >
        <div className="-mx-4 -mt-2 flex h-full flex-col overflow-hidden">
          <SidebarMegaMenu
            categories={sidebarCategories}
            defaultActiveId={sidebarCategories[0]?.id}
            height={680}
            className="w-full rounded-none border-0 shadow-none"
          />
          <div className="border-t border-secondary-200 px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-400">
              Điều hướng nhanh
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/community/builds"
                onClick={() => setDrawerOpen(false)}
                className="inline-flex items-center gap-2 text-sm font-medium text-secondary-700 transition-colors hover:text-primary-600"
              >
                <UserGroupIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Cộng đồng Build PC
              </Link>
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
        </div>
      </Drawer>

      <style jsx>{`
        @keyframes navbar-marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
      `}</style>
    </>
  );
}
