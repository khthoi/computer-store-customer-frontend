"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MegaMenuItem {
  /** Unique key */
  value: string;
  /** Display label */
  label: string;
  /** Link target */
  href: string;
  /** Optional Heroicon or any ReactNode */
  icon?: ReactNode;
  /** Small descriptor shown beneath the label */
  description?: string;
}

export interface MegaMenuColumn {
  /** Column heading */
  heading: string;
  items: MegaMenuItem[];
}

export interface MegaMenuTrigger {
  /** Label shown in the nav bar */
  label: string;
  /** Columns rendered in the dropdown panel */
  columns: MegaMenuColumn[];
  /** Optional footer link/content shown at the bottom of the panel */
  footer?: ReactNode;
}

export interface MegaMenuProps {
  /** List of top-level nav triggers with their dropdown columns */
  triggers: MegaMenuTrigger[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MegaMenu — multi-column dropdown navigation for product categories.
 *
 * ```tsx
 * <MegaMenu
 *   triggers={[
 *     {
 *       label: "Components",
 *       columns: [
 *         {
 *           heading: "Processing",
 *           items: [
 *             { value: "cpu", label: "CPUs", href: "/products/cpu", icon: <CpuChipIcon className="w-5 h-5" /> },
 *             { value: "gpu", label: "GPUs", href: "/products/gpu" },
 *           ],
 *         },
 *       ],
 *     },
 *   ]}
 * />
 * ```
 */
export function MegaMenu({ triggers, className = "" }: MegaMenuProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [positions, setPositions] = useState<Map<number, { top: number; left: number; width: number }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const close = useCallback(() => setActiveIndex(null), []);

  const toggle = useCallback((i: number) => {
    setActiveIndex((prev) => (prev === i ? null : i));
  }, []);

  // Calculate dropdown positions
  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const updatePosition = (index: number) => {
      const triggerEl = triggerRefs.current.get(index);
      if (!triggerEl) return;

      const rect = triggerEl.getBoundingClientRect();
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(index, {
          top: rect.bottom + 8, // mt-2 = 8px gap
          left: rect.left,
          width: Math.max(rect.width, 480),
        });
        return next;
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => updatePosition(activeIndex));

    // Update position on scroll/resize
    const handleUpdate = () => updatePosition(activeIndex);
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    if (activeIndex === null) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const triggerEl = triggerRefs.current.get(activeIndex);
      const dropdownEl = dropdownRefs.current.get(activeIndex);
      
      if (
        !triggerEl?.contains(target) &&
        !dropdownEl?.contains(target) &&
        !containerRef.current?.contains(target)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [activeIndex, close]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") close();
    },
    [close]
  );

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={["relative flex items-center gap-1", className]
        .filter(Boolean)
        .join(" ")}
    >
      {triggers.map((trigger, i) => {
        const isOpen = activeIndex === i;
        const position = positions.get(i);
        return (
          <div
            key={trigger.label}
            ref={(el) => {
              if (el) triggerRefs.current.set(i, el);
              else triggerRefs.current.delete(i);
            }}
            className="relative"
          >
            {/* Trigger button */}
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => toggle(i)}
              className={[
                "flex items-center gap-1 rounded px-3 py-2 text-sm font-medium transition-colors",
                isOpen
                  ? "bg-primary-50 text-primary-700"
                  : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              ].join(" ")}
            >
              {trigger.label}
              <ChevronDownIcon
                className={[
                  "w-4 h-4 text-secondary-400 transition-transform duration-150",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden="true"
              />
            </button>

            {/* Dropdown panel - rendered via portal */}
            {isOpen &&
              position &&
              typeof document !== "undefined" &&
              createPortal(
                <div
                  ref={(el) => {
                    if (el) dropdownRefs.current.set(i, el);
                    else dropdownRefs.current.delete(i);
                  }}
                  role="region"
                  aria-label={`${trigger.label} menu`}
                  className="fixed z-[9999] min-w-[480px] rounded-lg border border-secondary-200 bg-white shadow-xl"
                  style={{
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${position.width}px`,
                  }}
                >
                  {/* Columns */}
                  <div
                    className={[
                      "grid gap-0 p-5",
                      trigger.columns.length === 1
                        ? "grid-cols-1"
                        : trigger.columns.length === 2
                        ? "grid-cols-2"
                        : "grid-cols-3",
                    ].join(" ")}
                  >
                    {trigger.columns.map((col) => (
                      <div key={col.heading}>
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                          {col.heading}
                        </p>
                        <ul role="list" className="flex flex-col gap-0.5">
                          {col.items.map((item) => (
                            <li key={item.value}>
                              <a
                                href={item.href}
                                onClick={close}
                                className="flex items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary-50 group"
                              >
                                {item.icon && (
                                  <span
                                    className="mt-0.5 shrink-0 w-5 h-5 text-secondary-400 group-hover:text-primary-600 transition-colors"
                                    aria-hidden="true"
                                  >
                                    {item.icon}
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <span className="block font-medium text-secondary-800 group-hover:text-primary-700">
                                    {item.label}
                                  </span>
                                  {item.description && (
                                    <span className="block text-xs text-secondary-500 mt-0.5">
                                      {item.description}
                                    </span>
                                  )}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  {trigger.footer && (
                    <div className="border-t border-secondary-100 px-5 py-3">
                      {trigger.footer}
                    </div>
                  )}
                </div>,
                document.body
              )}
          </div>
        );
      })}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name      Type               Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * triggers  MegaMenuTrigger[]  required Top-level nav items with dropdown columns
 * className string             ""       Extra classes on the root wrapper
 *
 * ─── MegaMenuTrigger ──────────────────────────────────────────────────────────
 *
 * Name     Type              Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label    string            yes       Button label in nav bar
 * columns  MegaMenuColumn[]  yes       Columns shown in dropdown panel
 * footer   ReactNode         no        Footer slot at the bottom of panel
 *
 * ─── MegaMenuColumn ───────────────────────────────────────────────────────────
 *
 * Name     Type            Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * heading  string          yes       Column heading (uppercase label)
 * items    MegaMenuItem[]  yes       Links in this column
 *
 * ─── MegaMenuItem ─────────────────────────────────────────────────────────────
 *
 * Name         Type       Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * value        string     yes       Unique key
 * label        string     yes       Link label
 * href         string     yes       Link target
 * icon         ReactNode  no        Heroicon or custom icon node
 * description  string     no        Subtitle shown beneath label
 */

// ═══════════════════════════════════════════════════════════════════════════════
// SidebarMegaMenu — sidebar-driven category mega menu (e-commerce style)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarMenuLink {
  label: string;
  href: string;
  /** Small badge rendered after the label, e.g. "Hot", "New" */
  badge?: string;
  /** Show a › arrow indicating a sub-level */
  hasChildren?: boolean;
  /** Sub-items rendered as a right-side flyout panel on hover */
  children?: SidebarMenuLink[];
}

export interface SidebarMenuSection {
  id: string;
  heading: string;
  /** Optional badge on the heading, e.g. "Hot" */
  headingBadge?: string;
  /** Makes the heading itself a clickable link */
  headingHref?: string;
  items: SidebarMenuLink[];
  hiddenItems?: SidebarMenuLink[];
}

export interface SidebarMenuBrand {
  name: string;
  href: string;
  /** If provided, rendered as an <img> */
  logoSrc?: string;
}

export interface SidebarMenuPanel {
  /**
   * Each element is a vertical column of sections.
   * `columns[0]` = leftmost column, etc.
   */
  columns: SidebarMenuSection[][];
  /** Optional brand logo / text grid shown in the last column */
  brands?: SidebarMenuBrand[];
}

export interface SidebarMenuCategory {
  id: string;
  label: string;
  /** Optional icon rendered before the label */
  icon?: ReactNode;
  /** Badge rendered after the label, e.g. "Hot" */
  badge?: string;
  /** Direct link when the category has no panel */
  href?: string;
  /** Mega-menu panel shown on hover */
  panel?: SidebarMenuPanel;
}

export interface SidebarMegaMenuProps {
  categories: SidebarMenuCategory[];
  /** ID of the category to highlight by default */
  defaultActiveId?: string;
  /**
   * Height of the component in pixels.
   * @default 480
   */
  height?: number;
  className?: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BadgeChip({ text }: { text: string }) {
  const isHot = text.toLowerCase() === "hot";
  return (
    <span
      className={[
        "-translate-y-1 ml-1.5 inline-flex items-center self-start rounded px-1 py-0.5 text-[10px] font-bold uppercase leading-none",
        isHot
          ? "bg-red-500 text-white"
          : "bg-primary-500 text-white",
      ].join(" ")}
    >
      {text}
    </span>
  );
}

/**
 * FlyoutItem — renders a single menu link.
 * If the item has `children`, hovering opens a portal-based flyout panel
 * at `position: fixed` aligned to the right edge of the item — enabling
 * unlimited nesting depth without any `overflow` clipping.
 */
function FlyoutItem({ item }: { item: SidebarMenuLink }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subItems = item.children ?? [];
  const hasSub = subItems.length > 0;

  function openSub() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.right });
  }

  function closeSub() {
    timerRef.current = setTimeout(() => setPos(null), 50);
  }

  function cancelClose() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const linkCls =
    "flex items-center justify-between py-0.5 text-xs text-secondary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:text-primary-700";

  if (!hasSub) {
    return (
      <a href={item.href} className={linkCls}>
        <span className="flex items-center gap-1 min-w-0">
          <span className="truncate">{item.label}</span>
          {item.badge && <BadgeChip text={item.badge} />}
        </span>
      </a>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={openSub}
      onMouseLeave={closeSub}
    >
      <a href={item.href} className={linkCls}>
        <span className="flex items-center gap-1 min-w-0">
          <span className="truncate">{item.label}</span>
          {item.badge && <BadgeChip text={item.badge} />}
        </span>
        <ChevronRightIcon
          className="w-3.5 h-3.5 shrink-0 ml-1 text-secondary-400"
          aria-hidden="true"
        />
      </a>
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-[300] min-w-[200px] rounded-lg border border-secondary-200 bg-white py-1 shadow-xl"
            style={{ top: pos.top, left: pos.left + 6 }}
            onMouseEnter={cancelClose}
            onMouseLeave={closeSub}
          >
            <ul role="list" className="flex flex-col">
              {subItems.map((child) => (
                <li key={child.label} className="px-3">
                  <FlyoutItem item={child} />
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

function SectionBlock({
  section,
  expanded,
  onToggle,
}: {
  section: SidebarMenuSection;
  expanded: boolean;
  onToggle: (sectionId: string) => void;
}) {
  const visibleItems = expanded
    ? [...section.items, ...(section.hiddenItems ?? [])]
    : section.items;
  const hiddenCount = section.hiddenItems?.length ?? 0;

  return (
    <div className="mb-3">
      {/* Section heading */}
      <div className="mb-1 flex items-center gap-1">
        {section.headingHref ? (
          <a
            href={section.headingHref}
            className="inline-flex items-center gap-1 border-b border-transparent pb-0.5 text-xs font-semibold text-primary-700 transition-colors hover:border-primary-600"
          >
            <span>{section.heading}</span>
            {section.headingBadge && <BadgeChip text={section.headingBadge} />}
            <ChevronRightIcon className="ml-0.5 h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
          </a>
        ) : (
          <>
            <span className="text-xs font-semibold text-primary-700">
              {section.heading}
            </span>
            {section.headingBadge && <BadgeChip text={section.headingBadge} />}
          </>
        )}
      </div>

      {/* Items */}
      <ul role="list" className="flex flex-col gap-0.5">
        {visibleItems.map((item) => (
          <li key={item.label}>
            <FlyoutItem item={item} />
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => onToggle(section.id)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 hover:underline"
          >
            <span>{expanded ? "Thu gọn" : `Xem thêm ${hiddenCount} mục`}</span>
            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SidebarMegaMenu ──────────────────────────────────────────────────────────

/**
 * SidebarMegaMenu — e-commerce style category navigation.
 * Hover a left-sidebar category to reveal a multi-column panel with sections,
 * links, and an optional brand grid.
 *
 * ```tsx
 * <SidebarMegaMenu
 *   categories={STORE_MEGA_MENU}
 *   defaultActiveId="laptop-gaming"
 *   height={480}
 * />
 * ```
 */
export function SidebarMegaMenu({
  categories,
  defaultActiveId,
  height,
  className = "",
}: SidebarMegaMenuProps) {
  const fallbackId = defaultActiveId ?? categories[0]?.id ?? null;
  const [activeId, setActiveId] = useState<string | null>(fallbackId);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;
  const panel = activeCategory?.panel ?? null;
  const desktopMaxHeight = "min(720px, calc(100vh - 140px))";

  function handleCategoryEnter(id: string) {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    // Short delay prevents accidental switches during diagonal mouse movement
    // from sidebar → panel. 50ms is imperceptible but filters stray hover events.
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    switchTimerRef.current = setTimeout(() => {
      setActiveId(id);
      setExpandedSectionIds(new Set());
    }, 50);
  }

  function handleContainerLeave() {
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    // Reset to default category instead of null — eliminates blank panel flash.
    closeTimerRef.current = setTimeout(() => setActiveId(fallbackId), 200);
  }

  function handleContainerEnter() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    };
  }, []);

  function toggleSection(sectionId: string) {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  // Panel layout: content columns + optional brands column
  const contentCols = panel?.columns ?? [];
  const brands = panel?.brands ?? [];
  const totalCols = contentCols.length + (brands.length > 0 ? 1 : 0);

  return (
    <div
      className={[
        "flex overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        height,
        maxHeight: height ? undefined : desktopMaxHeight,
      }}
      onMouseLeave={handleContainerLeave}
      onMouseEnter={handleContainerEnter}
    >
      {/* ── Left sidebar ── */}
      <nav
        aria-label="Product categories"
        className="min-h-0 w-56 shrink-0 overflow-y-auto border-r border-secondary-100 bg-secondary-50"
      >
        <ul role="list" className="flex flex-col">
          {categories.map((cat) => {
            const isActive = cat.id === activeId;
            const sharedClass = [
              "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400",
              isActive
                ? "bg-white font-medium text-primary-700 shadow-sm"
                : "text-secondary-700 hover:bg-white hover:text-primary-600 cursor-pointer",
            ].join(" ");

            const iconNode = cat.icon && (
              <span className="w-4 h-4 shrink-0 text-secondary-400" aria-hidden="true">
                {cat.icon}
              </span>
            );

            return (
              <li key={cat.id}>
                {cat.href ? (
                  /* Has href — always a navigable link; hover still opens the panel */
                  <Link
                    href={cat.href}
                    className={sharedClass}
                    onMouseEnter={() => handleCategoryEnter(cat.id)}
                  >
                    {iconNode}
                    <span className="flex-1 truncate">{cat.label}</span>
                    {cat.badge && <BadgeChip text={cat.badge} />}
                    {cat.panel && (
                      <ChevronRightIcon
                        className={["w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary-500" : "text-secondary-300"].join(" ")}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                ) : (
                  /* No href — panel-only trigger, use button */
                  <button
                    type="button"
                    onMouseEnter={() => handleCategoryEnter(cat.id)}
                    onClick={() => handleCategoryEnter(cat.id)}
                    className={sharedClass}
                    aria-expanded={isActive}
                  >
                    {iconNode}
                    <span className="flex-1 truncate text-left">{cat.label}</span>
                    {cat.badge && <BadgeChip text={cat.badge} />}
                    <ChevronRightIcon
                      className={["w-4 h-4 shrink-0 transition-colors", isActive ? "text-primary-500" : "text-secondary-300"].join(" ")}
                      aria-hidden="true"
                    />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Right panel ── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {panel ? (
          <div className="h-full p-5">
            <div
              className="grid h-full gap-x-6 gap-y-2"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, totalCols)}, minmax(0, 1fr))`,
              }}
            >
              {/* Content columns */}
              {contentCols.map((sections, colIdx) => (
                <div key={colIdx} className="min-w-0">
                  {sections.map((section) => (
                    <SectionBlock
                      key={section.id}
                      section={section}
                      expanded={expandedSectionIds.has(section.id)}
                      onToggle={toggleSection}
                    />
                  ))}
                </div>
              ))}

              {/* Brands column */}
              {brands.length > 0 && (
                <div className="min-w-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-400">
                    Thương Hiệu
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {brands.map((brand) => (
                      <a
                        key={brand.name}
                        href={brand.href}
                        className="flex items-center justify-center rounded border border-secondary-200 bg-secondary-50 p-2 transition-colors hover:border-primary-300 hover:bg-primary-50"
                        title={brand.name}
                      >
                        {brand.logoSrc ? (
                          <img
                            src={brand.logoSrc}
                            alt={brand.name}
                            className="h-6 max-w-[72px] object-contain"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-secondary-700">
                            {brand.name}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-secondary-400">Chọn danh mục để xem sản phẩm</p>
          </div>
        )}
      </div>
    </div>
  );
}
