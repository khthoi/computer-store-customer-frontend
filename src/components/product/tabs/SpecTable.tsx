import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpecRow {
  /** Specification label (e.g. "Processor") */
  label: string;
  /** Specification value (string, number, or rich node) */
  value: ReactNode;
}

export interface SpecTableProps {
  /** Specification rows for the primary product */
  specs: SpecRow[];
  /**
   * Optional second product's spec values for side-by-side comparison.
   * Must have the same length and order as `specs`.
   */
  compareSpecs?: SpecRow[];
  /**
   * Highlight rows where the two spec values differ.
   * Only used when `compareSpecs` is provided.
   * @default true
   */
  highlightDiffs?: boolean;
  /** Table caption for screen readers */
  caption?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function specValToString(val: ReactNode): string {
  if (typeof val === "string" || typeof val === "number") return String(val);
  return "";
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SpecTable — two-column key/value table for technical specifications.
 * Optionally renders a third column for comparison with another product
 * and highlights rows where values differ.
 *
 * ```tsx
 * // Single product
 * <SpecTable
 *   caption="Intel Core i9-14900K Specifications"
 *   specs={[
 *     { label: "Core Count",     value: "24 (8P + 16E)" },
 *     { label: "Base Clock",     value: "3.2 GHz" },
 *     { label: "Max Turbo",      value: "6.0 GHz" },
 *     { label: "TDP",            value: "125 W" },
 *   ]}
 * />
 *
 * // Side-by-side comparison
 * <SpecTable specs={product1Specs} compareSpecs={product2Specs} />
 * ```
 */
export function SpecTable({
  specs,
  compareSpecs,
  highlightDiffs = true,
  caption,
  className = "",
}: SpecTableProps) {
  const isComparison = compareSpecs !== undefined && compareSpecs.length > 0;

  return (
    <div
      className={[
        "overflow-hidden rounded-md border border-secondary-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <table className="w-full text-sm">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}

        {isComparison && (
          <thead>
            <tr className="border-b border-secondary-200 bg-secondary-50">
              <th
                scope="col"
                className="w-2/5 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500"
              >
                Specification
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-primary-700"
              >
                Product A
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-600"
              >
                Product B
              </th>
            </tr>
          </thead>
        )}

        <tbody className="divide-y divide-secondary-100">
          {specs.map((row, idx) => {
            const compareRow = compareSpecs?.[idx];
            const isDiff =
              isComparison &&
              highlightDiffs &&
              compareRow !== undefined &&
              specValToString(row.value) !== specValToString(compareRow.value);

            return (
              <tr
                key={row.label}
                className={[
                  "transition-colors",
                  isDiff ? "bg-warning-50" : idx % 2 === 0 ? "bg-white" : "bg-secondary-50/50",
                ].join(" ")}
              >
                {/* Label */}
                <th
                  scope="row"
                  className="w-2/5 px-4 py-3 text-left font-medium text-secondary-600"
                >
                  {row.label}
                  {isDiff && (
                    <span className="ml-2 inline-flex h-1.5 w-1.5 rounded-full bg-warning-400" aria-label="Values differ" />
                  )}
                </th>

                {/* Primary value */}
                <td className="px-4 py-3 text-secondary-800">
                  {row.value}
                </td>

                {/* Comparison value */}
                {isComparison && (
                  <td
                    className={[
                      "px-4 py-3",
                      isDiff ? "font-medium text-secondary-900" : "text-secondary-800",
                    ].join(" ")}
                  >
                    {compareRow?.value ?? "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/*
 * ─── Prop Table ───────────────────────────────────────────────────────────────
 *
 * Name           Type        Default  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * specs          SpecRow[]   required Primary product spec rows
 * compareSpecs   SpecRow[]   —        Second product specs (enables comparison mode)
 * highlightDiffs boolean     true     Highlight rows where values differ
 * caption        string      —        Screen-reader table caption
 * className      string      ""       Extra classes on root div
 *
 * ─── SpecRow ──────────────────────────────────────────────────────────────────
 *
 * Name   Type       Required  Description
 * ──────────────────────────────────────────────────────────────────────────────
 * label  string     yes       Specification name
 * value  ReactNode  yes       Specification value (string, number, or JSX)
 */
