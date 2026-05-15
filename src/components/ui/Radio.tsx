"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadioSize = "sm" | "md" | "lg";

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Text label beside the radio button */
  label?: string;
  /** Secondary descriptive text below the label */
  description?: string;
  /** Validation error message (typically shown on the parent RadioGroup) */
  errorMessage?: string;
  /** @default "md" */
  size?: RadioSize;
}

export interface RadioGroupProps {
  /** Group label (rendered as a <fieldset> legend) */
  legend?: string;
  /** Error message shown below all options */
  errorMessage?: string;
  /** Helper text shown below all options */
  helperText?: string;
  /** Layout direction
   * @default "vertical"
   */
  direction?: "vertical" | "horizontal";
  children: ReactNode;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const DOT: Record<RadioSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const DOT_INNER: Record<RadioSize, string> = {
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
};

const TEXT: Record<RadioSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// ─── Radio component ──────────────────────────────────────────────────────────

/**
 * Radio — single radio button with label and description.
 * Always use inside a `<RadioGroup>` for correct accessibility.
 *
 * ```tsx
 * <RadioGroup legend="Shipping method" errorMessage={shippingError}>
 *   <Radio name="shipping" value="standard" label="Standard (3–5 days)" checked={shipping === "standard"} onChange={handleChange} />
 *   <Radio name="shipping" value="express" label="Express (1–2 days)" checked={shipping === "express"} onChange={handleChange} />
 * </RadioGroup>
 * ```
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  {
    label,
    description,
    errorMessage,
    size = "md",
    id: idProp,
    disabled = false,
    className = "",
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const errorId = `${id}-error`;
  const descId = `${id}-desc`;
  const hasError = Boolean(errorMessage);

  const describedBy =
    [hasError ? errorId : null, description ? descId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={disabled ? `opacity-60 ${className}` : className}>
      <div className="flex items-start gap-3">
        {/* Input + custom visual */}
        <div className={`relative mt-0.5 shrink-0 ${DOT[size]}`}>
          {/* Native input: transparent overlay */}
          <input
            ref={ref}
            type="radio"
            id={id}
            disabled={disabled}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...rest}
          />

          {/* Custom visual circle */}
          <div
            aria-hidden="true"
            className={[
              "flex items-center justify-center rounded-full border-2 transition-colors duration-150",
              DOT[size],
              "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-1",
              hasError
                ? "border-error-400 peer-checked:border-error-500 peer-checked:[&_div]:scale-100"
                : "border-secondary-300 peer-checked:border-primary-600 peer-checked:[&_div]:scale-100",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* Inner dot — shown via peer-checked */}
            <div
              className={[
                "rounded-full transition-all duration-150 scale-0",
                DOT_INNER[size],
                hasError
                  ? "bg-error-500"
                  : "bg-primary-600",
              ].join(" ")}
            />
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
});

// ─── RadioGroup component ─────────────────────────────────────────────────────

/**
 * RadioGroup — fieldset wrapper that provides accessible legend, error,
 * and helper text for a group of Radio buttons.
 *
 * ```tsx
 * <RadioGroup legend="Payment method" errorMessage={error} direction="horizontal">
 *   <Radio name="payment" value="cod"  label="Cash on Delivery" />
 *   <Radio name="payment" value="bank" label="Bank Transfer" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  legend,
  errorMessage,
  helperText,
  direction = "vertical",
  children,
}: RadioGroupProps) {
  const errorId = useId();
  const helperId = useId();
  const hasError = Boolean(errorMessage);

  return (
    <fieldset
      aria-describedby={
        [hasError ? errorId : null, !hasError && helperText ? helperId : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
    >
      {legend && (
        <legend className="mb-2 text-sm font-medium text-secondary-700">
          {legend}
        </legend>
      )}

      <div
        className={
          direction === "horizontal"
            ? "flex flex-wrap gap-x-6 gap-y-3"
            : "flex flex-col gap-3"
        }
      >
        {children}
      </div>

      {hasError && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-error-600">
          {errorMessage}
        </p>
      )}
      {!hasError && helperText && (
        <p id={helperId} className="mt-2 text-xs text-secondary-500">
          {helperText}
        </p>
      )}
    </fieldset>
  );
}

/*
 * ─── Radio Prop Table ─────────────────────────────────────────────────────────
 *
 * Name          Type               Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label         string             —        Text label beside the radio
 * description   string             —        Secondary text below label
 * errorMessage  string             —        Per-radio error (prefer RadioGroup error)
 * size          "sm"|"md"|"lg"     "md"     Visual size
 * checked       boolean            —        Controlled checked state
 * name          string             —        HTML name (group radios with same name)
 * value         string             —        HTML value submitted with the form
 * onChange      ChangeEventHandler —        Change handler
 * disabled      boolean            false    Disables and dims the control
 * id            string             auto     HTML id; auto-generated if omitted
 *
 * ─── RadioGroup Prop Table ────────────────────────────────────────────────────
 *
 * Name          Type                       Default    Description
 * ──────────────────────────────────────────────────────────────────────────────
 * legend        string                     —          <fieldset> legend text
 * errorMessage  string                     —          Error shown below all radios
 * helperText    string                     —          Hint shown below all radios
 * direction     "vertical"|"horizontal"    "vertical" Layout direction
 * children      ReactNode                  required   Radio components
 */
