"use client";

import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles,
  FloatingPortal,
  type Placement,
} from "@floating-ui/react";
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TooltipPlacement = Placement;

export interface TooltipProps {
  /** Tooltip text or JSX */
  content: ReactNode;
  /**
   * Preferred placement relative to the trigger.
   * Auto-flips when near a viewport edge.
   * @default "top"
   */
  placement?: TooltipPlacement;
  /**
   * Gap between trigger and tooltip panel (px).
   * @default 8
   */
  offsetPx?: number;
  /**
   * Hover open delay (ms).
   * @default 200
   */
  delay?: number;
  /** Kept for API compatibility — ignored by Floating UI layout. */
  maxWidth?: string;
  /** Disable the tooltip entirely */
  disabled?: boolean;
  /**
   * Anchor the tooltip to the trigger's inline text content (its layout boxes)
   * instead of the trigger element's full bounding box. Useful for
   * `line-clamp`/`truncate` text inside a wide block container, where the
   * default tooltip position would float over empty space next to the text.
   *
   * Implementation: measures the trigger's contents via a DOM `Range` and
   * feeds the resulting rect to Floating UI's position reference.
   * @default false
   */
  anchorToContent?: boolean;
  /**
   * Trigger element. Must be a single React element so Floating UI can
   * attach its ref directly to the real DOM node (native HTML elements and
   * `forwardRef` components both work).
   */
  children: ReactElement;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Tooltip — portal-rendered, Floating UI–positioned tooltip.
 *
 * Renders into `document.body` via `FloatingPortal` so it can never be
 * clipped by `overflow-hidden`, `transform`, `filter`, or z-index
 * stacking contexts in ancestor elements.
 *
 * ```tsx
 * <Tooltip content="Thêm vào giỏ hàng">
 *   <button onClick={handleCart}>
 *     <ShoppingCartIcon className="h-4 w-4" />
 *   </button>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  placement = "top",
  offsetPx = 8,
  delay = 50,
  disabled = false,
  anchorToContent = false,
  children,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);
  const triggerElRef = useRef<HTMLElement | null>(null);

  const {
    refs,
    floatingStyles,
    context,
    middlewareData,
    placement: resolvedPlacement,
  } = useFloating({
    open,
    onOpenChange: disabled ? undefined : setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetPx),
      flip({ fallbackAxisSideDirection: "start", padding: 6 }),
      shift({ padding: 6 }),
      arrow({ element: arrowRef }),
    ],
  });

  const hover = useHover(context, { move: false, delay: { open: delay, close: 0 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: "tooltip" });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  // Fade + slight translate animation
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    initial: { opacity: 0, transform: "scale(0.94)" },
    open: { opacity: 1, transform: "scale(1)" },
    close: { opacity: 0, transform: "scale(0.94)" },
    duration: 120,
  });

  // Arrow positioning — point towards the trigger element
  const arrowX = middlewareData.arrow?.x;
  const arrowY = middlewareData.arrow?.y;
  const arrowSide = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right",
  }[resolvedPlacement.split("-")[0]] as "top" | "right" | "bottom" | "left";

  // Combined ref that captures the real DOM node (used by anchorToContent's
  // Range measurement) and forwards to Floating UI's reference setter.
  const setTriggerRef = useCallback(
    (el: HTMLElement | null) => {
      triggerElRef.current = el;
      refs.setReference(el);
    },
    [refs],
  );

  // When anchorToContent is true and the tooltip is open, override the
  // position reference with a virtual element backed by a DOM Range over
  // the trigger's contents. The getBoundingClientRect closure re-measures
  // on every Floating UI tick so autoUpdate keeps the panel aligned.
  useEffect(() => {
    if (!anchorToContent || !open) return;
    const el = triggerElRef.current;
    if (!el) return;
    refs.setPositionReference({
      getBoundingClientRect: () => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      },
      getClientRects: () => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getClientRects();
      },
    });
    return () => {
      // Revert to the trigger element so non-anchored opens use the default.
      refs.setPositionReference(null);
    };
  }, [anchorToContent, open, refs]);

  // Inject ref + interaction props directly into the child element so
  // Floating UI measures the real DOM node — not a wrapper with zero size.
  const trigger = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
      ref: setTriggerRef,
      ...getReferenceProps(),
    })
    : children;

  return (
    <>
      {trigger}

      {/* Portal — escapes any overflow-hidden / transform / z-index parent */}
      <FloatingPortal>
        {isMounted && !disabled && content && (
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 9999 }}
            {...getFloatingProps()}
            className="pointer-events-auto"
          >
            <div
              style={transitionStyles}
              className="rounded-md bg-secondary-900 px-2.5 py-1.5 text-[11px] font-medium leading-none text-white shadow-lg"
            >
              {content}
            </div>
          </div>
        )}
      </FloatingPortal>
    </>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name       Type              Default  Description
 * ────────────────────────────────────────────────────────────────────────────
 * content    ReactNode         required Tooltip text / JSX
 * placement  Placement         "top"    Preferred side; auto-flips near edges
 * offsetPx   number            8        Gap between trigger and panel (px)
 * delay      number            200      Hover open delay (ms)
 * disabled   boolean           false    Suppress tooltip entirely
 * children   ReactNode         required The element that triggers the tooltip
 */
