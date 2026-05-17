import type {
  CompareProduct,
  CompareSpecGroup as CompareSpecGroupType,
} from "@/src/components/compare-ui/types";
import { CompareRow } from "@/src/components/compare-ui/table/CompareRow";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompareSpecGroupProps {
  group: CompareSpecGroupType;
  products: CompareProduct[];
  showDiffsOnly: boolean;
  /** First row index of this group — used to keep alternating background
   *  continuous across groups */
  rowOffset: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRowAllSame(
  row: CompareSpecGroupType["rows"][number],
  products: CompareProduct[]
): boolean {
  const vals = products.map((p) => row.values[p.id]).filter(Boolean);
  return vals.length < 2 || vals.every((v) => v === vals[0]);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareSpecGroup — renders a section header + its spec rows.
 *
 * The group header uses `grid-column: 1 / -1` so it spans every column in the
 * parent CSS Grid. The individual CompareRow components use `display: contents`
 * so their cells participate directly in the parent grid columns.
 */
export function CompareSpecGroup({
  group,
  products,
  showDiffsOnly,
  rowOffset,
}: CompareSpecGroupProps) {
  const visibleRows = showDiffsOnly
    ? group.rows.filter((row) => !isRowAllSame(row, products))
    : group.rows;

  if (visibleRows.length === 0) return null;

  return (
    <>
      {/*
       * Group header — direct grid child that spans all columns.
       * The outer display:contents row wrapper was removed: it served no
       * purpose here since the header div already uses gridColumn:"1 / -1"
       * to span the full grid width as a direct grid item.
       */}
      <div
        role="columnheader"
        aria-colspan={products.length + 1}
        style={{ gridColumn: "1 / -1" }}
        className="flex items-center border-b border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800"
      >
        {group.label}
      </div>

      {/* Spec rows */}
      {visibleRows.map((row, i) => (
        <CompareRow
          key={row.key}
          row={row}
          products={products}
          isEvenRow={(rowOffset + i) % 2 === 0}
        />
      ))}
    </>
  );
}
