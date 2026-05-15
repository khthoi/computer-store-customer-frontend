"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Size variant for the Input */
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visible label rendered above the input */
  label?: string;
  /** Supplementary text rendered below the input. Hidden when errorMessage is set. */
  helperText?: string;
  /** Validation error message. Sets aria-invalid and red border. */
  errorMessage?: string;
  /** Icon or element placed inside the left edge of the input */
  prefixIcon?: ReactNode;
  /** Icon or element placed inside the right edge of the input */
  suffixIcon?: ReactNode;
  /** Input height / text size variant
   * @default "md"
   */
  size?: InputSize;
  /** Stretch the wrapper to fill its container
   * @default false
   */
  fullWidth?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const INPUT_BASE =
  "w-full rounded border bg-white text-secondary-700 " +
  "placeholder:text-secondary-400 " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-400";

const SIZE: Record<InputSize, string> = {
  sm: "h-8  px-3      text-sm",
  md: "h-10 px-3      text-sm",
  lg: "h-12 px-4      text-base",
};

/** Left padding applied when a prefix icon is present */
const SIZE_WITH_PREFIX: Record<InputSize, string> = {
  sm: "pl-8",
  md: "pl-9",
  lg: "pl-10",
};

/** Right padding applied when a suffix icon is present */
const SIZE_WITH_SUFFIX: Record<InputSize, string> = {
  sm: "pr-8",
  md: "pr-9",
  lg: "pr-10",
};

/** Icon size aligned to each input size (applied to direct SVG children) */
const ICON_INSET: Record<InputSize, string> = {
  sm: "[&>svg]:h-3.5 [&>svg]:w-3.5",
  md: "[&>svg]:h-4 [&>svg]:w-4",
  lg: "[&>svg]:h-5 [&>svg]:w-5",
};

const STATE_NORMAL =
  "border-secondary-300 " +
  "focus:border-primary-500 focus:ring-primary-500/15";

const STATE_ERROR =
  "border-error-400 " +
  "focus:border-error-500 focus:ring-error-500/15";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Input — single-line text input with label, helper text, and validation.
 *
 * ```tsx
 * // Basic controlled
 * <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} />
 *
 * // With validation error
 * <Input
 *   label="Password"
 *   type="password"
 *   errorMessage="Must be at least 8 characters"
 * />
 *
 * // With icons
 * <Input
 *   label="Search"
 *   prefixIcon={<SearchIcon />}
 *   suffixIcon={<ClearIcon />}
 *   placeholder="Search products…"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    errorMessage,
    prefixIcon,
    suffixIcon,
    size = "md",
    fullWidth = false,
    id: idProp,
    className = "",
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(errorMessage);

  const describedBy = [
    hasError ? errorId : null,
    !hasError && helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className={fullWidth ? "w-full" : "w-full"}>
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

      {/* Input wrapper — positions prefix/suffix icons */}
      <div className="relative">
        {/* Prefix icon */}
        {prefixIcon && (
          <span
            className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-secondary-400 ${ICON_INSET[size]}`}
            aria-hidden="true"
          >
            {prefixIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={[
            INPUT_BASE,
            SIZE[size],
            hasError ? STATE_ERROR : STATE_NORMAL,
            prefixIcon ? SIZE_WITH_PREFIX[size] : "",
            suffixIcon ? SIZE_WITH_SUFFIX[size] : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

        {/* Suffix icon */}
        {suffixIcon && (
          <span
            className={`pointer-events-none absolute inset-y-0 right-3 flex items-center text-secondary-400 ${ICON_INSET[size]}`}
            aria-hidden="true"
          >
            {suffixIcon}
          </span>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-error-600">
          {errorMessage}
        </p>
      )}

      {/* Helper text — hidden when error is shown */}
      {!hasError && helperText && (
        <p id={helperId} className="mt-1 text-xs text-secondary-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name          Type              Default   Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label         string            —         Visible label above the input
 * helperText    string            —         Hint text below; hidden when errorMessage set
 * errorMessage  string            —         Validation error; sets aria-invalid + red border
 * prefixIcon    ReactNode         —         Icon inside left edge
 * suffixIcon    ReactNode         —         Icon inside right edge
 * size          "sm"|"md"|"lg"    "md"      Height + text size variant
 * fullWidth     boolean           false     Stretch wrapper to container width
 * id            string            auto      HTML id; auto-generated if omitted
 * disabled      boolean           false     Native disabled state
 * placeholder   string            —         Input placeholder text
 * value         string            —         Controlled value
 * defaultValue  string            —         Uncontrolled default
 * onChange      ChangeEventHandler —        Controlled change handler
 * className     string            ""        Extra Tailwind classes on <input>
 *
 * All native <input> HTML attributes are also supported via spread.
 * Note: native `size` attribute is omitted from spread to avoid conflicts.
 */
