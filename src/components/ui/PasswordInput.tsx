"use client";

import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PasswordInputSize = "sm" | "md" | "lg";

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  size?: PasswordInputSize;
}

// ─── Style maps (mirrors Input.tsx) ───────────────────────────────────────────

const INPUT_BASE =
  "w-full rounded border bg-white text-secondary-700 " +
  "placeholder:text-secondary-400 " +
  "transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-400 " +
  // Hide the native browser password-reveal button (Edge/IE) and Chrome autofill icon
  // so only the custom toggle button is visible.
  "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden " +
  "[&::-webkit-credentials-auto-fill-button]:hidden " +
  "[&::-webkit-contacts-auto-fill-button]:hidden";

const SIZE: Record<PasswordInputSize, string> = {
  sm: "h-8  pl-3 pr-9  text-sm",
  md: "h-10 pl-3 pr-10 text-sm",
  lg: "h-12 pl-4 pr-11 text-base",
};

const STATE_NORMAL =
  "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/15";

const STATE_ERROR =
  "border-error-400 focus:border-error-500 focus:ring-error-500/15";

const TOGGLE_SIZE: Record<PasswordInputSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PasswordInput — password field with show/hide visibility toggle.
 *
 * Mirrors the Input component's visual design but replaces the pointer-events-none
 * suffix with a real interactive button so screen readers announce it correctly.
 *
 * ```tsx
 * <PasswordInput
 *   label="Mật khẩu"
 *   value={password}
 *   onChange={(e) => setPassword(e.target.value)}
 *   errorMessage={errors.password}
 * />
 * ```
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    {
      label,
      helperText,
      errorMessage,
      size = "md",
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
    const [visible, setVisible] = useState(false);
    const hasError = Boolean(errorMessage);

    const describedBy = [
      hasError ? errorId : null,
      !hasError && helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className="mb-1 inline-block text-sm font-medium text-secondary-700"
          >
            {label}
          </label>
        )}

        {/* Input + toggle button wrapper */}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            className={[
              INPUT_BASE,
              SIZE[size],
              hasError ? STATE_ERROR : STATE_NORMAL,
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {/* Visibility toggle — NOT aria-hidden, so screen readers announce it */}
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-controls={id}
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-secondary-400 transition-colors hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
          >
            {visible ? (
              <EyeSlashIcon className={TOGGLE_SIZE[size]} aria-hidden="true" />
            ) : (
              <EyeIcon className={TOGGLE_SIZE[size]} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Error message */}
        {hasError && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-error-600">
            {errorMessage}
          </p>
        )}

        {/* Helper text */}
        {!hasError && helperText && (
          <p id={helperId} className="mt-1 text-xs text-secondary-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
