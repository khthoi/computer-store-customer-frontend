"use client";

import { useCallback, useState } from "react";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RatingStarsProps {
  /** Rating value 0–5 (supports 0.5 steps in display mode) */
  value: number;
  /** Total review/rating count shown next to the stars */
  count?: number;
  /**
   * "display" — read-only stars (0.5-step precision).
   * "input"   — interactive, integer steps only.
   * @default "display"
   */
  mode?: "display" | "input";
  /** Called in "input" mode when the user selects a rating */
  onChange?: (value: number) => void;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ─── Style map ────────────────────────────────────────────────────────────────

const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const TEXT_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

// ─── Sub-component: single star cell ─────────────────────────────────────────

/** Renders a full, half, or empty star using Heroicons only (no custom SVG). */
function Star({
  fill,
  sizeClass,
}: {
  fill: "full" | "half" | "empty";
  sizeClass: string;
}) {
  if (fill === "full") {
    return (
      <StarSolid className={`${sizeClass} text-warning-400`} aria-hidden="true" />
    );
  }
  if (fill === "empty") {
    return (
      <StarOutline className={`${sizeClass} text-secondary-300`} aria-hidden="true" />
    );
  }
  // Half star: outline base + solid left half clipped via overflow-hidden
  return (
    <span className={`relative inline-flex ${sizeClass}`} aria-hidden="true">
      <StarOutline className={`${sizeClass} text-secondary-300`} />
      <span className="absolute inset-0 w-1/2 overflow-hidden">
        <StarSolid className={`${sizeClass} text-warning-400`} />
      </span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * RatingStars — read-only display with half-star precision, or interactive input.
 *
 * ```tsx
 * // Read-only with review count
 * <RatingStars value={4.5} count={128} />
 *
 * // Interactive rating input
 * <RatingStars mode="input" value={rating} onChange={setRating} size="lg" />
 * ```
 */
export function RatingStars({
  value,
  count,
  mode = "display",
  onChange,
  size = "md",
  className = "",
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const sizeClass = SIZE_CLASS[size];
  const textClass = TEXT_SIZE[size];

  const displayValue = hoverValue ?? value;

  // Build 5-star fill array for display mode (0.5-step precision)
  const starFills: Array<"full" | "half" | "empty"> = Array.from(
    { length: 5 },
    (_, i) => {
      const starNumber = i + 1;
      if (displayValue >= starNumber) return "full";
      if (displayValue >= starNumber - 0.5) return "half";
      return "empty";
    }
  );

  const handleClick = useCallback(
    (starValue: number) => {
      if (mode === "input") onChange?.(starValue);
    },
    [mode, onChange]
  );

  const handleMouseEnter = useCallback(
    (starValue: number) => {
      if (mode === "input") setHoverValue(starValue);
    },
    [mode]
  );

  const handleMouseLeave = useCallback(() => {
    if (mode === "input") setHoverValue(null);
  }, [mode]);

  const label =
    mode === "display"
      ? `Rating: ${value} out of 5${count !== undefined ? `, ${count} reviews` : ""}`
      : `Select rating: ${hoverValue ?? value} of 5 stars`;

  return (
    <div
      className={["inline-flex items-center gap-1.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        role={mode === "input" ? "radiogroup" : undefined}
        aria-label={mode === "display" ? label : undefined}
        aria-roledescription={mode === "display" ? undefined : "Star rating"}
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {starFills.map((fill, i) => {
          const starValue = i + 1;
          if (mode === "input") {
            return (
              <button
                key={starValue}
                type="button"
                role="radio"
                aria-checked={value === starValue}
                aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
                onClick={() => handleClick(starValue)}
                onMouseEnter={() => handleMouseEnter(starValue)}
                className="cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <Star
                  fill={
                    (hoverValue ?? value) >= starValue ? "full" : "empty"
                  }
                  sizeClass={sizeClass}
                />
              </button>
            );
          }
          return <Star key={starValue} fill={fill} sizeClass={sizeClass} />;
        })}
      </span>

      {count !== undefined && (
        <span className={`${textClass} text-secondary-500`} aria-hidden="true">
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name       Type                       Default    Description
 * ──────────────────────────────────────────────────────────────────────────────
 * value      number (0–5)               required   Current rating
 * count      number                     —          Review count shown in parentheses
 * mode       "display"|"input"          "display"  Read-only or interactive
 * onChange   (value: number) => void    —          Called in input mode on select
 * size       "sm"|"md"|"lg"             "md"       Icon and text dimensions
 * className  string                     ""         Extra classes on root element
 */
