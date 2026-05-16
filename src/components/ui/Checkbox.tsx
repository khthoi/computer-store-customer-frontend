"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { CheckIcon, MinusIcon } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckboxSize = "sm" | "md" | "lg";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Text label beside the checkbox */
  label?: string;
  /** Secondary descriptive text below the label */
  description?: string;
  /** Validation error message */
  errorMessage?: string;
  /**
   * Sets the indeterminate visual state (a minus icon instead of a checkmark).
   * Useful for "select all" controls when only some children are selected.
   * @default false
   */
  indeterminate?: boolean;
  /** @default "md" */
  size?: CheckboxSize;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const BOX: Record<CheckboxSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const ICON: Record<CheckboxSize, string> = {
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
};

const TEXT: Record<CheckboxSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};


// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Checkbox — controlled/uncontrolled checkbox with label, description,
 * error state, and indeterminate support.
 *
 * ```tsx
 * // Controlled
 * <Checkbox
 *   label="Accept terms"
 *   checked={agreed}
 *   onChange={(e) => setAgreed(e.target.checked)}
 * />
 *
 * // Indeterminate (select-all pattern)
 * <Checkbox
 *   label="Select all"
 *   indeterminate={someSelected && !allSelected}
 *   checked={allSelected}
 *   onChange={toggleAll}
 * />
 *
 * // With description and error
 * <Checkbox
 *   label="Subscribe"
 *   description="Receive weekly deals and product updates."
 *   errorMessage="You must agree to continue."
 * />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      description,
      errorMessage,
      indeterminate = false,
      size = "md",
      id: idProp,
      checked,
      defaultChecked,
      onChange,
      disabled = false,
      className = "",
      ...rest
    },
    forwardedRef
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const descId = `${id}-desc`;
    const innerRef = useRef<HTMLInputElement>(null);
    const hasError = Boolean(errorMessage);

    // Support both controlled and uncontrolled modes
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(
      defaultChecked ?? false
    );
    const isChecked = isControlled ? (checked ?? false) : internalChecked;

    // indeterminate is a DOM property, not a standard HTML attribute
    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Merge forwarded ref + inner ref
    const mergeRef = useCallback(
      (node: HTMLInputElement | null) => {
        (innerRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef)
          (
            forwardedRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
      },
      [forwardedRef]
    );

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalChecked(e.target.checked);
      onChange?.(e);
    };

    const showCheck = isChecked && !indeterminate;
    const showMinus = indeterminate;
    const isActive = isChecked || indeterminate;

    const describedBy =
      [hasError ? errorId : null, description ? descId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={disabled ? `opacity-60 ${className}` : className}>
        <div className={`flex gap-3 ${description ? "items-start" : "items-center"}`}>
          {/* Input + custom visual wrapper */}
          <div className={`relative shrink-0 ${description ? "mt-0.5" : ""} ${BOX[size]}`}>
            {/* Native input: transparent overlay — captures all pointer + keyboard events */}
            <input
              ref={mergeRef}
              type="checkbox"
              id={id}
              checked={isControlled ? isChecked : undefined}
              defaultChecked={!isControlled ? internalChecked : undefined}
              onChange={handleChange}
              disabled={disabled}
              aria-invalid={hasError || undefined}
              aria-describedby={describedBy}
              className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              {...rest}
            />

            {/* Custom visual box */}
            <div
              aria-hidden="true"
              className={[
                "flex items-center justify-center rounded-sm border-2 transition-colors duration-150",
                BOX[size],
                // Focus ring via peer-focus-visible (input is peer, this is its sibling)
                "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1",
                hasError
                  ? isActive
                    ? "border-error-500 bg-error-500"
                    : "border-error-400 bg-white"
                  : isActive
                  ? "border-primary-600 bg-primary-600"
                  : "border-secondary-300 bg-white",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {showMinus && (
                <MinusIcon className={`${ICON[size]} text-white`} aria-hidden="true" />
              )}
              {showCheck && (
                <CheckIcon className={`${ICON[size]} text-white`} aria-hidden="true" />
              )}
            </div>
          </div>

          {/* Label + description */}
          {(label || description) && (
            <div className="min-w-0">
              {label && (
                <label
                  htmlFor={id}
                  className={[
                    "inline-block font-medium text-secondary-800",
                    TEXT[size],
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  {label}
                </label>
              )}
              {description && (
                <p id={descId} className="mt-0.5 text-xs text-secondary-500">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>

        {hasError && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-error-600">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name           Type               Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label          string             —        Text label beside the checkbox
 * description    string             —        Secondary text below label
 * errorMessage   string             —        Validation error; red border
 * indeterminate  boolean            false    Minus-icon state (partial selection)
 * size           "sm"|"md"|"lg"     "md"     Box + text size
 * checked        boolean            —        Controlled checked state
 * defaultChecked boolean            false    Uncontrolled initial state
 * onChange       ChangeEventHandler —        Change handler
 * disabled       boolean            false    Disables and dims the control
 * id             string             auto     HTML id; auto-generated if omitted
 * className      string             ""       Extra classes on root div
 *
 * All native <input type="checkbox"> attributes are also supported.
 */
