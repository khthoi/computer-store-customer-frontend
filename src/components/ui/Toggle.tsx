"use client";

import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToggleSize = "sm" | "md" | "lg";

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Text label beside the toggle */
  label?: string;
  /** Secondary descriptive text below the label */
  description?: string;
  /** @default "md" */
  size?: ToggleSize;
  /** Place the label before the toggle
   * @default false
   */
  labelLeft?: boolean;
  /** Place the label block above the toggle
   * @default false
   */
  labelTop?: boolean;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────
//  Each size defines: track width/height, knob size, knob translate-x when on

const TRACK_W: Record<ToggleSize, string> = {
  sm: "w-8",
  md: "w-10",
  lg: "w-12",
};
const TRACK_H: Record<ToggleSize, string> = {
  sm: "h-4",
  md: "h-5",
  lg: "h-6",
};
const KNOB: Record<ToggleSize, string> = {
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4.5",
};
/** Translate when checked — should equal (track-width - knob-size - 2*padding) */
const KNOB_ON: Record<ToggleSize, string> = {
  sm: "peer-checked:translate-x-4",
  md: "peer-checked:translate-x-5",
  lg: "peer-checked:translate-x-6",
};
const TEXT: Record<ToggleSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Toggle — an accessible on/off switch.
 *
 * ```tsx
 * // Controlled
 * <Toggle
 *   label="Email notifications"
 *   description="Receive order updates via email."
 *   checked={emailEnabled}
 *   onChange={(e) => setEmailEnabled(e.target.checked)}
 * />
 *
 * // Uncontrolled with label on left
 * <Toggle label="Dark mode" labelLeft defaultChecked />
 * ```
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  {
    label,
    description,
    size = "md",
    labelLeft = false,
    labelTop = false,
    id: idProp,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    className = "",
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const descId = `${id}-desc`;

  // Support controlled and uncontrolled modes
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(
    defaultChecked ?? false
  );
  const isChecked = isControlled ? (checked ?? false) : internalChecked;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalChecked(e.target.checked);
    onChange?.(e);
  };

  const track = (
    <div className={`relative shrink-0 ${TRACK_W[size]} ${TRACK_H[size]}`}>
      {/* Native input: transparent overlay */}
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        id={id}
        checked={isControlled ? isChecked : undefined}
        defaultChecked={!isControlled ? internalChecked : undefined}
        onChange={handleChange}
        disabled={disabled}
        aria-describedby={description ? descId : undefined}
        aria-checked={isChecked}
        className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...rest}
      />

      {/* Track */}
      <div
        aria-hidden="true"
        className={[
          "flex h-full w-full items-center rounded-full transition-colors duration-200",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2",
          isChecked
            ? "bg-primary-600"
            : "bg-secondary-300",
          disabled ? "opacity-60" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {/* Knob */}
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute top-1/2 left-0.5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-200",
          KNOB[size],
          KNOB_ON[size],
          isChecked ? "translate-x-[var(--toggle-on-x)]" : "translate-x-0",
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );

  const textContent = (label || description) && (
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
  );

  return (
    <div
      className={[
        labelTop ? "mb-4 flex flex-col items-start gap-2" : "mb-4 flex items-center gap-3",
        disabled ? "opacity-60" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {labelTop ? (
        <>
          {textContent}
          {track}
        </>
      ) : (
        <>
          {labelLeft && textContent}
          {track}
          {!labelLeft && textContent}
        </>
      )}
    </div>
  );
});

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name          Type               Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label         string             —        Text label beside the toggle
 * description   string             —        Secondary text below label
 * size          "sm"|"md"|"lg"     "md"     Toggle dimensions
 * labelLeft     boolean            false    Render label before the track
 * labelTop      boolean            false    Render label block above the track
 * checked       boolean            —        Controlled state
 * defaultChecked boolean           false    Uncontrolled initial state
 * onChange      ChangeEventHandler —        Change handler
 * disabled      boolean            false    Disables and dims
 * id            string             auto     HTML id; auto-generated if omitted
 * className     string             ""       Extra classes on root div
 */
