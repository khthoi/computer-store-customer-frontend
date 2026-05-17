"use client";

import { useCallback } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuantityStepperProps {
  value: number;
  onChange: (qty: number) => void;
  /** @default 1 */
  min?: number;
  max: number;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
}: QuantityStepperProps) {
  const decrement = useCallback(() => {
    if (value > min) onChange(value - 1);
  }, [value, min, onChange]);

  const increment = useCallback(() => {
    if (value < max) onChange(value + 1);
  }, [value, max, onChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10);
      if (isNaN(parsed)) return;
      onChange(Math.max(min, Math.min(max, parsed)));
    },
    [min, max, onChange]
  );

  const isAtMin = disabled || value <= min;
  const isAtMax = disabled || value >= max;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="inline-flex items-center">
        {/* Decrement */}
        <button
          type="button"
          aria-label="Giảm số lượng"
          onClick={decrement}
          disabled={isAtMin}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-l-lg border border-secondary-300 bg-white transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:z-10",
            isAtMin
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-secondary-100 cursor-pointer",
          ].join(" ")}
        >
          <MinusIcon className="w-4 h-4 text-secondary-600" aria-hidden="true" />
        </button>

        {/* Quantity input */}
        <input
          type="text"
          inputMode="numeric"
          aria-label="Số lượng"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-14 h-10 border-y border-secondary-300 text-center font-medium text-secondary-900 bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 disabled:bg-secondary-100 disabled:text-secondary-400"
        />

        {/* Increment */}
        <button
          type="button"
          aria-label="Tăng số lượng"
          onClick={increment}
          disabled={isAtMax}
          className={[
            "flex h-10 w-10 items-center justify-center rounded-r-lg border border-secondary-300 bg-white transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:z-10",
            isAtMax
              ? "opacity-40 cursor-not-allowed"
              : "hover:bg-secondary-100 cursor-pointer",
          ].join(" ")}
        >
          <PlusIcon className="w-4 h-4 text-secondary-600" aria-hidden="true" />
        </button>
      </div>

      <span className="text-xs text-secondary-500">
        Còn {max} sản phẩm có thể mua
      </span>
    </div>
  );
}
