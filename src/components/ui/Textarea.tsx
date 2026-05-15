"use client";

import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  type ChangeEvent,
  type TextareaHTMLAttributes,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Size variant for the Textarea */
export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label rendered above the textarea */
  label?: string;
  /** Supplementary text rendered below the textarea. Hidden when errorMessage is set. */
  helperText?: string;
  /** Validation error message. Sets aria-invalid and red border. */
  errorMessage?: string;
  /** Height / text size variant
   * @default "md"
   */
  size?: TextareaSize;
  /**
   * Automatically grows the textarea to fit its content.
   * Removes the manual resize handle.
   * @default false
   */
  autoResize?: boolean;
  /**
   * Shows a live "current / max" character counter below the textarea.
   * Requires either `maxLength` or `maxCount` to be provided.
   * @default false
   */
  showCharCount?: boolean;
  /**
   * Maximum number shown in the character counter.
   * Falls back to `maxLength` when omitted.
   * Useful when you want a soft visual limit without enforcing maxLength.
   */
  maxCount?: number;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const TEXTAREA_BASE =
  "w-full rounded border bg-white text-secondary-700 " +
  "placeholder:text-secondary-400 " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-400";

const SIZE: Record<TextareaSize, string> = {
  sm: "px-3 py-2   text-sm  min-h-[80px]",
  md: "px-3 py-2.5 text-sm  min-h-[100px]",
  lg: "px-4 py-3   text-base min-h-[120px]",
};

const STATE_NORMAL =
  "border-secondary-300 " +
  "focus:border-primary-500 focus:ring-primary-500/15";

const STATE_ERROR =
  "border-error-400 " +
  "focus:border-error-500 focus:ring-error-500/15";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Textarea — multi-line text input with auto-resize, character count,
 * label, helper text, and validation.
 *
 * ```tsx
 * // Controlled with auto-resize
 * <Textarea
 *   label="Product description"
 *   value={description}
 *   onChange={e => setDescription(e.target.value)}
 *   autoResize
 * />
 *
 * // With character counter (soft limit shown, hard limit enforced)
 * <Textarea
 *   label="Short bio"
 *   maxLength={200}
 *   showCharCount
 *   helperText="Keep it brief."
 * />
 *
 * // With validation error
 * <Textarea
 *   label="Return reason"
 *   errorMessage="Please describe the issue (min. 20 characters)."
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
      autoResize = false,
      showCharCount = false,
      maxCount,
      id: idProp,
      onChange,
      value,
      defaultValue,
      maxLength,
      className = "",
      ...rest
    },
    forwardedRef
  ) {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const hasError = Boolean(errorMessage);

    // Resolve the display limit: prefer explicit maxCount, fall back to maxLength
    const displayLimit = maxCount ?? maxLength;

    // For controlled inputs, derive current length from value prop
    const currentLength = value !== undefined ? String(value).length : undefined;

    const describedBy = [
      hasError ? errorId : null,
      !hasError && helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    // ── Auto-resize handler ───────────────────────────────────────────────────
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (autoResize && innerRef.current) {
          // Reset height first so scrollHeight shrinks correctly on deletion
          innerRef.current.style.height = "auto";
          innerRef.current.style.height = `${innerRef.current.scrollHeight}px`;
        }
        onChange?.(e);
      },
      [autoResize, onChange]
    );

    // ── Merge forwarded ref + inner ref ───────────────────────────────────────
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (
            forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>
          ).current = node;
        }
      },
      [forwardedRef]
    );

    // ── Character counter color ───────────────────────────────────────────────
    const isAtLimit =
      displayLimit !== undefined &&
      currentLength !== undefined &&
      currentLength >= displayLimit;

    const counterClass = isAtLimit
      ? "text-error-600 font-medium"
      : "text-secondary-400";

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="mb-1 inline-block text-sm font-medium text-secondary-700"
          >
            {label}
            {rest.required && (
              <span className="ml-0.5 text-error-600" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={setRef}
          id={id}
          value={value}
          defaultValue={defaultValue}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
          className={[
            TEXTAREA_BASE,
            SIZE[size],
            hasError ? STATE_ERROR : STATE_NORMAL,
            autoResize ? "resize-none overflow-hidden" : "resize-y",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

        {/* Bottom row: error/helper on the left, char count on the right */}
        <div className="mt-1 flex items-start justify-between gap-2">
          <div className="min-w-0">
            {hasError && (
              <p id={errorId} role="alert" className="text-xs text-error-600">
                {errorMessage}
              </p>
            )}
            {!hasError && helperText && (
              <p id={helperId} className="text-xs text-secondary-500">
                {helperText}
              </p>
            )}
          </div>

          {showCharCount && displayLimit !== undefined && (
            <p
              aria-live="polite"
              aria-atomic="true"
              className={`shrink-0 tabular-nums text-xs ${counterClass}`}
            >
              {currentLength ?? 0}/{displayLimit}
            </p>
          )}
        </div>
      </div>
    );
  }
);

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name          Type               Default   Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label         string             —         Visible label above the textarea
 * helperText    string             —         Hint text below; hidden when errorMessage set
 * errorMessage  string             —         Validation error; sets aria-invalid + red border
 * size          "sm"|"md"|"lg"     "md"      Height + text size variant
 * autoResize    boolean            false     Grows height to fit content; removes resize handle
 * showCharCount boolean            false     Shows "n / max" counter; needs maxLength or maxCount
 * maxCount      number             —         Display limit for counter (overrides maxLength display)
 * maxLength     number             —         Native max characters (enforced by browser)
 * id            string             auto      HTML id; auto-generated if omitted
 * disabled      boolean            false     Native disabled state
 * placeholder   string             —         Placeholder text
 * value         string             —         Controlled value
 * defaultValue  string             —         Uncontrolled default
 * onChange      ChangeEventHandler —         Controlled change handler
 * rows          number             —         Initial visible rows (overrides min-height)
 * className     string             ""        Extra Tailwind classes on <textarea>
 *
 * All native <textarea> HTML attributes are also supported via spread.
 */
