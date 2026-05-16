"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

export interface ModalProps {
  /** Controls visibility */
  isOpen: boolean;
  /** Called when the modal requests to close (Escape, backdrop click, close button) */
  onClose: () => void;
  /** Modal heading text — used as aria-labelledby */
  title?: string;
  /**
   * Size variant controlling max-width
   * @default "md"
   */
  size?: ModalSize;
  /**
   * Close when clicking the backdrop
   * @default true
   */
  closeOnBackdrop?: boolean;
  /**
   * Close when Escape key is pressed
   * @default true
   */
  closeOnEscape?: boolean;
  /**
   * Hide the built-in close (×) button
   * @default false
   */
  hideCloseButton?: boolean;
  /** Footer slot — renders below the content, separated by a border */
  footer?: ReactNode;
  /**
   * Enable Framer Motion enter/exit animations.
   * - Overlay: opacity fade
   * - Panel: opacity + scale (0.95 → 1.0)
   * When false the modal mounts/unmounts instantly.
   * @default false
   */
  animated?: boolean;
  children: ReactNode;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const SIZE: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  "2xl": "max-w-3xl",
  "3xl": "max-w-4xl",
  "4xl": "max-w-5xl",
  "5xl": "max-w-6xl",
  full: "max-w-full mx-4",
};

// ─── Framer Motion variants ───────────────────────────────────────────────────

const OVERLAY_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const PANEL_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const TRANSITION = { duration: 0.2, ease: "easeOut" } as const;

// ─── Shared panel content ─────────────────────────────────────────────────────

interface PanelContentProps {
  title?: string;
  titleId: string;
  hideCloseButton: boolean;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

function PanelContent({
  title,
  titleId,
  hideCloseButton,
  footer,
  onClose,
  children,
}: PanelContentProps) {
  return (
    <>
      {/* Header */}
      {(title || !hideCloseButton) && (
        <div className="flex shrink-0 items-center justify-between border-b border-secondary-200 px-6 py-4">
          {title ? (
            <h2 id={titleId} className="text-lg font-semibold text-secondary-900">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {!hideCloseButton && (
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
          {footer}
        </div>
      )}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Modal — accessible dialog with focus trap, Escape key, and portal rendering.
 *
 * Set `animated` to `true` for Framer Motion enter/exit transitions
 * (overlay fade + panel scale). Defaults to instant mount/unmount.
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>Open Modal</Button>
 *
 * <Modal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   title="Confirm Delete"
 *   animated
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   Are you sure you want to delete this item? This action cannot be undone.
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  hideCloseButton = false,
  footer,
  animated = false,
  children,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // ── Client-side mount guard (createPortal requires document) ──────────────

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Focus management ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const timer = setTimeout(() => {
      const focusables = panelRef.current
        ? getFocusableElements(panelRef.current)
        : [];
      focusables[0]?.focus();
    }, 20);

    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    previousFocusRef.current?.focus();
  }, [isOpen]);

  // ── Scroll lock ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // ── Keyboard: Escape + focus trap ─────────────────────────────────────────

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

  // ── Shared props for the panel element ────────────────────────────────────

  const panelClassName = [
    "relative z-10 flex w-full flex-col rounded-lg bg-white shadow-modal",
    "max-h-[calc(100vh-2rem)] overflow-hidden",
    SIZE[size],
  ].join(" ");

  const panelContent = (
    <PanelContent
      title={title}
      titleId={titleId}
      hideCloseButton={hideCloseButton}
      footer={footer}
      onClose={onClose}
    >
      {children}
    </PanelContent>
  );

  if (!isMounted) return null;

  // ── Animated mode: AnimatePresence stays mounted, handles exit animation ──

  if (animated) {
    return createPortal(
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={handleKeyDown}
          >
            {/* Overlay — fade in/out */}
            <motion.div
              aria-hidden="true"
              className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
              variants={OVERLAY_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={TRANSITION}
              onClick={closeOnBackdrop ? onClose : undefined}
            />

            {/* Panel — fade + scale in/out */}
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              className={panelClassName}
              variants={PANEL_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={TRANSITION}
            >
              {panelContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  // ── Instant mode (default): mounts/unmounts without animation ─────────────

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-secondary-900/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={panelClassName}
      >
        {panelContent}
      </div>
    </div>,
    document.body
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name              Type                  Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * isOpen            boolean               required Controls visibility
 * onClose           () => void            required Close callback (Esc, backdrop, ×)
 * title             string                —        Dialog heading + aria-labelledby
 * size              "sm"|"md"|"lg"|       "md"     Panel max-width
 *                   "xl"|"full"
 * closeOnBackdrop   boolean               true     Close on backdrop click
 * closeOnEscape     boolean               true     Close on Escape key
 * hideCloseButton   boolean               false    Hide the × button
 * footer            ReactNode             —        Footer slot (action buttons)
 * animated          boolean               false    Framer Motion fade+scale transitions
 * children          ReactNode             required Modal body content
 */
