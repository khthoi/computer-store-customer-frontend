import { memo } from "react";
import type { CompareProduct, CompareSpecRow } from "@/src/components/compare-ui/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareRowProps {
  row: CompareSpecRow;
  products: CompareProduct[];
  isEvenRow: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Parse the leading numeric part of a value string, e.g. "16 GB" → 16 */
function parseLeadingNumber(val: string): number | null {
  const m = val.match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

/**
 * Returns the index of the "winning" product for this row, or null if no
 * numeric comparison is possible.
 */
function findWinnerIndex(
  values: (string | undefined)[],
  higherIsBetter: boolean
): number | null {
  const nums = values.map((v) => (v ? parseLeadingNumber(v) : null));
  if (nums.every((n) => n === null)) return null;

  let bestIdx = -1;
  let best = higherIsBetter ? -Infinity : Infinity;

  nums.forEach((n, i) => {
    if (n === null) return;
    if (higherIsBetter ? n > best : n < best) {
      best = n;
      bestIdx = i;
    }
  });

  return bestIdx >= 0 ? bestIdx : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareRow — one spec row across all product columns.
 *
 * Renders as a `display: contents` row so its cells participate directly in
 * the parent CSS Grid (defined on CompareTable's grid container).
 *
 * Difference highlighting:
 *  • If all non-null values are identical → muted grey
 *  • If values differ and `higherIsBetter` is defined → trophy on winner cell
 *  • If values differ but `higherIsBetter` is undefined → bold on all cells
 */
export const CompareRow = memo(function CompareRow({
  row,
  products,
  isEvenRow,
}: CompareRowProps) {
  const baseBg = isEvenRow ? "bg-secondary-50/60" : "bg-white";

  const productValues = products.map((p) => row.values[p.id]);
  const nonNull = productValues.filter(Boolean);
  const allSame =
    nonNull.length < 2 || nonNull.every((v) => v === nonNull[0]);
  const hasDiff = !allSame;

  const winnerIdx =
    hasDiff && row.higherIsBetter !== undefined
      ? findWinnerIndex(productValues, row.higherIsBetter)
      : null;

  return (
    // `contents` makes this div "transparent" to the grid — its children
    // become direct participants in the parent grid layout.
    <div role="row" className="contents">
      {/* ── Label cell — sticky left ── */}
      <div
        role="rowheader"
        className={[
          "sticky left-0 z-10 flex min-h-[48px] items-center border-b border-secondary-100",
          "px-4 py-3 text-sm text-secondary-600",
          baseBg,
        ].join(" ")}
      >
        <span>
          {row.label}
          {row.unit && (
            <span className="ml-1 text-xs text-secondary-400">
              ({row.unit})
            </span>
          )}
        </span>
      </div>

      {/* ── Value cells — one per product ── */}
      {products.map((product, colIdx) => {
        const rawVal = productValues[colIdx];
        const displayVal = rawVal
          ? row.unit
            ? `${rawVal} ${row.unit}`
            : rawVal
          : null;

        const isWinner = winnerIdx !== null && colIdx === winnerIdx;
        const isDiffCell = hasDiff && rawVal !== undefined;

        return (
          <div
            key={product.id}
            role="gridcell"
            className={[
              "flex min-h-[48px] items-center gap-1.5 border-b border-l border-secondary-100",
              "px-4 py-3 text-sm",
              isWinner
                ? "bg-success-50 font-semibold text-success-700"
                : isDiffCell
                  ? `${baseBg} font-medium text-secondary-900`
                  : `${baseBg} text-secondary-600`,
            ].join(" ")}
          >
            {displayVal ? (
              <>
                <span>{displayVal}</span>
              </>
            ) : (
              <span className="text-secondary-300" aria-label="Không có dữ liệu">
                —
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
});
