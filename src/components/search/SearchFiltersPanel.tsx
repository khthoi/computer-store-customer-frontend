"use client";

import { Accordion, type AccordionItemDef } from "@/src/components/ui/Accordion";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Select } from "@/src/components/ui/Select";
import { Slider } from "@/src/components/ui/Slider";
import { Toggle } from "@/src/components/ui/Toggle";
import type {
  FilterDefinition,
  FilterState,
  FilterValue,
} from "@/src/app/(storefront)/products/_config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(value: number): string {
  return value.toLocaleString("vi-VN") + "₫";
}

function hasActiveFilters(state: FilterState): boolean {
  return Object.values(state).some((v) => {
    if (v === undefined || v === null) return false;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return true;
    if (typeof v === "string") return v !== "";
    if (Array.isArray(v)) return v.length > 0;
    return false;
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchFiltersPanelProps {
  definitions: FilterDefinition[];
  value: FilterState;
  onChange: (next: FilterState) => void;
  /** Called when user clicks "Áp dụng bộ lọc" */
  onApply?: () => void;
  /** Whether draft differs from applied state */
  hasChanges?: boolean;
}

// ─── Filter item renderer ─────────────────────────────────────────────────────

function FilterItem({
  def,
  value,
  onChange,
}: {
  def: FilterDefinition;
  value: FilterValue | undefined;
  onChange: (v: FilterValue | undefined) => void;
}) {
  switch (def.type) {
    case "dropdown":
      return (
        <Select
          options={def.options ?? []}
          value={(value as string[]) ?? []}
          onChange={(v) => {
            const arr = v as string[];
            onChange(arr.length > 0 ? arr : undefined);
          }}
          multiple
          clearable
          showSelectedInTrigger={false}
          placeholder="Tất cả"
          size="sm"
        />
      );

    case "checkbox":
      return (
        <div className="flex flex-col gap-2">
          {(def.options ?? []).map((opt) => {
            const selected = ((value as string[]) ?? []).includes(opt.value);
            return (
              <Checkbox
                key={opt.value}
                checked={selected}
                label={
                  opt.count !== undefined
                    ? `${opt.label} (${opt.count})`
                    : opt.label
                }
                onChange={(e) => {
                  const current = (value as string[]) ?? [];
                  const next = e.target.checked
                    ? [...current, opt.value]
                    : current.filter((v) => v !== opt.value);
                  onChange(next.length > 0 ? next : undefined);
                }}
              />
            );
          })}
        </div>
      );

    case "range": {
      const min = def.min ?? 0;
      const max = def.max ?? 100;
      const rangeVal = (value as [number, number]) ?? [min, max];
      return (
        <div className="space-y-2">
          <Slider
            min={min}
            max={max}
            step={def.step ?? 1}
            value={rangeVal}
            onChange={(v) => onChange(v as [number, number])}
          />
          <div className="flex justify-between text-xs text-secondary-500">
            <span>{def.unit === "₫" ? formatVND(rangeVal[0]) : `${rangeVal[0]}`}</span>
            <span>{def.unit === "₫" ? formatVND(rangeVal[1]) : `${rangeVal[1]}`}</span>
          </div>
        </div>
      );
    }

    case "toggle":
      return (
        <Toggle
          checked={(value as boolean) ?? false}
          onChange={(e) => onChange(e.target.checked || undefined)}
          label={def.label}
        />
      );

    case "rating": {
      const currentRating = (value as number) ?? 0;
      return (
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() =>
                onChange(currentRating === stars ? undefined : stars)
              }
              className={[
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors text-left",
                currentRating === stars
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-secondary-600 hover:bg-secondary-50",
              ].join(" ")}
            >
              <span className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={[
                      "h-4 w-4",
                      i < stars ? "text-yellow-400" : "text-secondary-200",
                    ].join(" ")}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span>{stars} sao trở lên</span>
            </button>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SearchFiltersPanel — vertical accordion-based filter sidebar for the search
 * results page.
 *
 * Renders each FilterDefinition as an Accordion item using the Accordion
 * component (variant="ghost"). Does not define its own filter types — imports
 * FilterDefinition/FilterState from products/demo/_config.ts.
 */
export function SearchFiltersPanel({
  definitions,
  value,
  onChange,
  onApply,
  hasChanges = false,
}: SearchFiltersPanelProps) {
  const isActive = hasActiveFilters(value);

  function updateFilter(key: string, v: FilterValue | undefined) {
    if (v === undefined) {
      const next = { ...value };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...value, [key]: v });
    }
  }

  const items: AccordionItemDef[] = definitions.map((def) => ({
    value: def.key,
    label: def.label,
    children: (
      <FilterItem
        def={def}
        value={value[def.key]}
        onChange={(v) => updateFilter(def.key, v)}
      />
    ),
  }));

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-semibold text-secondary-700">Bộ lọc</p>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({})}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <Accordion
        items={items}
        multiple
        variant="ghost"
        defaultValue={definitions.map((d) => d.key)}
      />

      {/* Apply button — only shown when there are unsaved changes */}
      {onApply && (
        <div className="pt-1">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={onApply}
            disabled={!hasChanges}
          >
            {hasChanges ? "Áp dụng bộ lọc" : "Đã áp dụng"}
          </Button>
        </div>
      )}
    </div>
  );
}
