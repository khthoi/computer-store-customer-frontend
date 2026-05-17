"use client";

import { useEffect, useState, useMemo } from "react";
import { useCompare } from "@/src/store/compare.store";
import { CompareSpecGroup } from "@/src/components/compare-ui/table/CompareSpecGroup";
import { CompareHighlightToggle } from "@/src/components/compare-ui/table/CompareHighlightToggle";
import { Tooltip } from "@/src/components/ui/Tooltip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CompareTable — the main comparison layout.
 *
 * Desktop: A single CSS Grid inside one overflow-x-auto container.
 *   Section 1 (top)    — product header cards + label-column spacer.
 *   Full-width divider — section title + highlight toggle.
 *   Section 2 (below)  — spec groups / rows.
 *
 *   Using one shared grid guarantees every product column aligns between the
 *   header cards above and the spec cells below without any scroll-sync JS.
 *   All position:sticky / z-index layering has been removed for full
 *   cross-browser stability (Chrome, Edge, Firefox, Safari).
 *
 * Mobile (<768 px): spec-first accordion where each group is a <details> block.
 */
export function CompareTable() {
  const { state } = useCompare();
  const { compareList: products } = state;
  const [showDiffsOnly, setShowDiffsOnly] = useState(false);
  const isMobile = useIsMobile();

  // Merge all specGroups from every product — use the first product that has
  // specGroups as the template, then pull each product's own values from its
  // own specGroups entry for each row.
  const mergedGroups = useMemo(() => {
    if (products.length === 0) return [];

    const templateProduct = products.find((p) => p.specGroups.length > 0);
    if (!templateProduct) return [];

    return templateProduct.specGroups.map((tGroup) => ({
      key: tGroup.key,
      label: tGroup.label,
      rows: tGroup.rows.map((tRow) => {
        const mergedValues: Record<string, string> = {};
        for (const product of products) {
          // Try the product's own specGroups first
          const ownGroup = product.specGroups.find((g) => g.key === tGroup.key);
          const ownRow = ownGroup?.rows.find((r) => r.key === tRow.key);
          // Fall back to template row's values map (supports the old flat format)
          const val =
            ownRow?.values[product.id] ?? tRow.values[product.id];
          if (val !== undefined) mergedValues[product.id] = val;
        }
        return { ...tRow, values: mergedValues };
      }),
    }));
  }, [products]);

  // Compute running row offsets per group for alternating row backgrounds
  const groupRowOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (const g of mergedGroups) {
      offsets.push(running);
      running += g.rows.length;
    }
    return offsets;
  }, [mergedGroups]);

  if (products.length < 2) return null;

  const colCount = products.length;
  const gridTemplateColumns = `200px repeat(${colCount}, minmax(240px, 1fr))`;
  const minWidth = `calc(200px + ${colCount} * 240px)`;

  // ── Mobile accordion layout ─────────────────────────────────────────────

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4">
        {/* Controls */}
        <div className="flex justify-end px-1">
          <CompareHighlightToggle
            value={showDiffsOnly}
            onChange={setShowDiffsOnly}
          />
        </div>

        {/* Spec groups as accordion
            Product thumbnails removed — CompareHeaderCardList (above the table
            in ComparePageClient) now owns all product-card rendering. */}
        {mergedGroups.map((group) => (
          <details
            key={group.key}
            open
            className="rounded-xl border border-secondary-200 bg-white"
          >
            <summary className="cursor-pointer select-none rounded-xl bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-800">
              {group.label}
            </summary>

            <div className="divide-y divide-secondary-100">
              {group.rows.map((row) => {
                const vals = products.map((p) => row.values[p.id]);
                const nonNull = vals.filter(Boolean);
                const allSame =
                  nonNull.length < 2 || nonNull.every((v) => v === nonNull[0]);
                if (showDiffsOnly && allSame) return null;

                return (
                  <div key={row.key} className="px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-secondary-500">
                      {row.label}
                      {row.unit && (
                        <span className="ml-1 text-secondary-400">
                          ({row.unit})
                        </span>
                      )}
                    </p>
                    <div className="flex gap-2">
                      {products.map((p) => {
                        const raw = row.values[p.id];
                        return (
                          <div
                            key={p.id}
                            className="flex min-w-0 flex-1 flex-col items-center gap-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.thumbnailSrc}
                              alt=""
                              className="h-6 w-6 rounded bg-secondary-100 object-contain"
                              aria-hidden="true"
                            />
                            <p
                              className={[
                                "text-center text-xs",
                                !allSame
                                  ? "font-semibold text-secondary-900"
                                  : "text-secondary-600",
                              ].join(" ")}
                            >
                              {raw
                                ? row.unit
                                  ? `${raw} ${row.unit}`
                                  : raw
                                : "—"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    );
  }

  // ── Desktop grid layout ──────────────────────────────────────────────────
  //
  // The product header cards are no longer rendered here.
  // CompareHeaderCardList (in ComparePageClient) owns that section.
  // This grid contains only: column-name header row → section divider → spec rows.

  return (
    <div className="flex flex-col gap-3">
      {/* Product count */}
      <p className="text-sm text-secondary-500">
        Đang so sánh{" "}
        <strong className="text-secondary-800">{products.length}</strong> sản phẩm
      </p>

      {/* Spec table */}
      <div className="overflow-x-auto rounded-xl border border-secondary-200 shadow-sm">
        <div
          role="grid"
          aria-label="Bảng so sánh thông số kỹ thuật"
          style={{ display: "grid", gridTemplateColumns, minWidth }}
        >
          {/* ── Column headers: spec label + product names ── */}

          {/* Label column */}
          <div
            role="columnheader"
            className="border-b-2 border-r border-secondary-200 bg-secondary-50 px-4 py-3 text-sm font-semibold text-secondary-700"
          >
            Thông số kỹ thuật
          </div>

          {/* One name cell per product — Tooltip reveals full name on hover */}
          {products.map((p) => (
            <div
              key={p.id}
              role="columnheader"
              className="border-b-2 border-l border-secondary-200 bg-white px-4 py-3"
            >
              <Tooltip content={p.name} placement="top">
                <p className="line-clamp-3 cursor-default text-sm font-semibold text-secondary-900">
                  {p.name}
                </p>
              </Tooltip>
            </div>
          ))}

          {/* ── Full-width divider: section title + diff toggle ── */}
          <div
            role="presentation"
            style={{ gridColumn: "1 / -1" }}
            className="flex items-center justify-between border-b border-secondary-200 bg-secondary-100 px-4 py-2.5"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-secondary-600">
              Thông số chi tiết
            </span>
            <CompareHighlightToggle
              value={showDiffsOnly}
              onChange={setShowDiffsOnly}
            />
          </div>

          {/* ── Spec groups ── */}
          {mergedGroups.map((group, gIdx) => (
            <CompareSpecGroup
              key={group.key}
              group={group}
              products={products}
              showDiffsOnly={showDiffsOnly}
              rowOffset={groupRowOffsets[gIdx]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
