"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DrawerPosition = "left" | "right" | "bottom";
export type DrawerSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface DrawerProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the drawer requests to close */
  onClose: () => void;
  /** Slide-in direction
   * @default "right"
   */
  position?: DrawerPosition;
  /** Panel width (left/right) or height (bottom)
   * @default "md"
   */
  size?: DrawerSize;
  /** Drawer heading */
  title?: string;
  /** Close when clicking the overlay
   * @default true
   */
  closeOnBackdrop?: boolean;
  /** Close on Escape key
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Show a drag-indicator pill at the top of the panel.
   * Only visible when position="bottom".
   * @default false
   */
  showDragIndicator?: boolean;
  /** Footer slot */
  footer?: ReactNode;
  children: ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FOCUSABLE =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled])," +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const SIDE_SIZE: Record<DrawerSize, string> = {
  sm: "w-72",
  md: "w-80",
  lg: "w-96",
  xl: "w-[30rem]",
  "2xl": "w-[42rem] max-w-[90vw]",
};

const BOTTOM_SIZE: Record<DrawerSize, string> = {
  sm: "max-h-[30vh]",
  md: "max-h-[50vh]",
  lg: "max-h-[70vh]",
  xl: "max-h-[90vh]",
  "2xl": "max-h-[95vh]",
};

const PANEL_POSITION: Record<DrawerPosition, string> = {
  left: "inset-y-0 left-0 flex-col",
  right: "inset-y-0 right-0 flex-col",
  bottom: "inset-x-0 bottom-0 flex-col rounded-t-2xl",
};

// ─── Framer Motion variants ───────────────────────────────────────────────────

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// Each position defines where the panel starts (hidden) and ends (visible).
const PANEL_VARIANTS: Record<DrawerPosition, Variants> = {
  left: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: 0 },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: 0 },
  },
};

const TRANSITION = { duration: 0.3, ease: "easeInOut" } as const;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drawer — slide-in panel from any edge, with overlay, focus trap, and portal.
 *
 * Animation is fully delegated to Framer Motion:
 *   • `AnimatePresence` handles mount/unmount and plays the exit animation
 *     before removing the element — no manual timing, no RAF, no state flags.
 *   • Overlay: opacity 0 → 1 → 0
 *   • Panel: translates in from its edge, reverses on close
 *
 * ```tsx
 * <Drawer isOpen={open} onClose={() => setOpen(false)} title="Cart" position="right">
 *   <CartItem ... />
 * </Drawer>
 * ```
 */
export function Drawer({
  isOpen,
  onClose,
  position = "right",
  size = "md",
  title,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showDragIndicator = false,
  footer,
  children,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isBottom = position === "bottom";

  // ── Focus management ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      previousFocusRef.current?.focus();
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;

    // Defer focus until Framer Motion has finished mounting the panel.
    const id = setTimeout(() => {
      const els = panelRef.current ? getFocusableElements(panelRef.current) : [];
      els[0]?.focus();
    }, 16);

    return () => clearTimeout(id);
  }, [isOpen]);

  // ── Scroll lock ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ── Keyboard: Escape + focus trap ────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (closeOnEscape && e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusables = getFocusableElements(panelRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [closeOnEscape, onClose]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (typeof document === "undefined") return null;

  return createPortal(
    // AnimatePresence watches its direct children's presence in the React tree.
    // When `isOpen` becomes false the children unmount — but AnimatePresence
    // keeps them alive until the `exit` animation completes, automatically.
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50"
          onKeyDown={handleKeyDown}
        >
          {/* ── Overlay ── */}
          <motion.div
            aria-hidden="true"
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={TRANSITION}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
          />

          {/* ── Panel ── */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            variants={PANEL_VARIANTS[position]}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={TRANSITION}
            className={[
              "absolute flex bg-white shadow-xl",
              PANEL_POSITION[position],
              isBottom
                ? `w-full ${BOTTOM_SIZE[size]}`
                : `h-full ${SIDE_SIZE[size]}`,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* Drag indicator — bottom drawer only */}
            {showDragIndicator && isBottom && (
              <div
                className="flex shrink-0 justify-center pb-1 pt-3"
                aria-hidden="true"
              >
                <div className="h-1 w-10 rounded-full bg-secondary-300" />
              </div>
            )}

            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-secondary-200 px-5 py-4">
              {title ? (
                <h2
                  id={titleId}
                  className="text-base font-semibold text-secondary-900"
                >
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <button
                type="button"
                aria-label="Close drawer"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <XMarkIcon className="size-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-secondary-200 px-5 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name             Type                      Default   Description
 * ──────────────────────────────────────────────────────────────────────────────
 * isOpen           boolean                   required  Controls visibility
 * onClose          () => void                required  Close callback
 * position         "left"|"right"|"bottom"   "right"   Slide-in direction
 * size             "sm"|"md"|"lg"|"xl"       "md"      Panel width/height
 * title            string                    —         Heading text
 * closeOnBackdrop  boolean                   true      Close on overlay click
 * closeOnEscape    boolean                   true      Close on Escape key
 * showDragIndicator boolean                  false     Pill handle (bottom only)
 * footer           ReactNode                 —         Bottom action area
 * children         ReactNode                 required  Drawer body content
 */
