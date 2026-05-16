"use client";

import { Fragment, type ReactNode } from "react";
import { ChevronRightIcon, HomeIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@/src/components/ui/Tooltip";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link target. Omit for the current (last) crumb. */
  href?: string;
  /** Optional icon rendered before the label */
  icon?: ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /**
   * Maximum visible crumbs before collapsing the middle ones with "…".
   * @default 0 — show all
   */
  maxItems?: number;
  /** Show a Home icon as the first crumb
   * @default false
   */
  showHome?: boolean;
  /** Custom separator node
   * @default ChevronRightIcon
   */
  separator?: ReactNode;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Breadcrumb — dynamic path trail with ellipsis truncation for deep paths.
 *
 * ```tsx
 * <Breadcrumb
 *   showHome
 *   items={[
 *     { label: "Components", href: "/products/components" },
 *     { label: "CPUs", href: "/products/components/cpu" },
 *     { label: "Intel Core i9-14900K" },
 *   ]}
 *   maxItems={4}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  maxItems = 0,
  showHome = false,
  separator,
  className = "",
}: BreadcrumbProps) {
  // Build the full list, prepending Home if requested
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/", icon: <HomeIcon className="w-4 h-4" aria-hidden="true" /> }, ...items]
    : items;

  // Determine which items to render vs. collapse
  let visibleItems: Array<BreadcrumbItem | "ellipsis"> = allItems;
  if (maxItems > 0 && allItems.length > maxItems) {
    // Always show first 1 and last (maxItems - 2) or last 1
    const keepStart = 1;
    const keepEnd = Math.max(1, maxItems - keepStart - 1);
    visibleItems = [
      ...allItems.slice(0, keepStart),
      "ellipsis",
      ...allItems.slice(allItems.length - keepEnd),
    ];
  }

  const sep = separator ?? (
    <ChevronRightIcon className="w-4 h-4 text-secondary-400 shrink-0" aria-hidden="true" />
  );

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        role="list"
        className="flex flex-wrap items-center gap-1 text-sm"
      >
        {visibleItems.map((item, idx) => {
          const isLast = idx === visibleItems.length - 1;

          if (item === "ellipsis") {
            return (
              <Fragment key="ellipsis">
                {/* Separator before ellipsis */}
                <li aria-hidden="true" className="flex items-center">
                  {sep}
                </li>
                <li>
                  <span
                    aria-label="More breadcrumbs"
                    className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-secondary-400"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4" aria-hidden="true" />
                  </span>
                </li>
              </Fragment>
            );
          }

          return (
            <Fragment key={`${item.label}-${idx}`}>
              {/* Separator (not before the very first item) */}
              {idx > 0 && (
                <li aria-hidden="true" className="flex items-center">
                  {sep}
                </li>
              )}

              <li className="flex items-center">
                <Tooltip content={item.label} placement="top">
                  {isLast || !item.href ? (
                    /* Current page — not a link */
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={[
                        "flex items-center gap-1 rounded px-1.5 py-0.5 font-medium truncate max-w-[160px] sm:max-w-[240px]",
                        isLast
                          ? "text-secondary-900"
                          : "text-secondary-500",
                      ].join(" ")}
                    >
                      {item.icon}
                      {item.label}
                    </span>
                  ) : (
                    /* Navigable link */
                    <a
                      href={item.href}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 truncate max-w-[160px] sm:max-w-[240px]"
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  )}
                </Tooltip>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name       Type              Default           Description
 * ──────────────────────────────────────────────────────────────────────────────
 * items      BreadcrumbItem[]  required          Path segments
 * maxItems   number            0 (show all)      Collapse middle items beyond this count
 * showHome   boolean           false             Prepend a Home icon crumb
 * separator  ReactNode         ChevronRightIcon  Custom separator between crumbs
 * className  string            ""                Extra classes on <nav>
 *
 * ─── BreadcrumbItem ───────────────────────────────────────────────────────────
 *
 * Name   Type       Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label  string     yes       Visible crumb text
 * href   string     no        Link URL (omit for current/last crumb)
 * icon   ReactNode  no        Icon rendered before label
 */
