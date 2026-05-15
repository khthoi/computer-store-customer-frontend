"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui";
import { formatVND } from "@/src/lib/format";
import type { FilterDefinition, FilterState, FilterValue } from "../_config";
import { isFilterActive } from "./FilterItem";

export interface ActiveFilterChip {
  key: string;
  label: string;
  group: string;
}

export function buildActiveFilters(
  state: FilterState,
  definitions: FilterDefinition[],
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  for (const def of definitions) {
    const val: FilterValue | undefined = state[def.key];
    if (!isFilterActive(val)) continue;

    switch (def.type) {
      case "dropdown":
      case "checkbox": {
        const arr = Array.isArray(val) ? (val as string[]) : val ? [val as string] : [];
        for (const v of arr) {
          const opt = def.options?.find((o) => o.value === v);
          if (opt) chips.push({ key: `${def.key}:${v}`, label: opt.label, group: def.label });
        }
        break;
      }
      case "select": {
        const v = String(val);
        const opt = def.options?.find((o) => o.value === v);
        chips.push({ key: def.key, label: opt?.label ?? v, group: def.label });
        break;
      }
      case "range": {
        const [min, max] = val as [number, number];
        const label =
          def.unit === "₫"
            ? `${formatVND(min)} – ${formatVND(max)}`
            : `${min} – ${max} ${def.unit ?? ""}`;
        chips.push({ key: def.key, label, group: def.label });
        break;
      }
      case "toggle":
        chips.push({ key: def.key, label: def.label, group: "" });
        break;
      case "rating":
        chips.push({
          key: def.key,
          label: `${String(val)}★ trở lên`,
          group: def.label,
        });
        break;
    }
  }
  return chips;
}

export function ActiveFiltersPanel({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: ActiveFilterChip[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  if (chips.length === 0) return null;

  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex flex-1 items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-medium text-secondary-500 shrink-0">
            Đang lọc:
          </span>
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
            >
              {chip.group && (
                <span className="text-primary-400">{chip.group}:</span>
              )}
              {chip.label}
              <button
                type="button"
                onClick={() => onRemove(chip.key)}
                className="ml-0.5 rounded-full p-0.5 text-primary-400 hover:bg-primary-100 hover:text-primary-600 transition-colors"
                aria-label={`Xoá bộ lọc ${chip.label}`}
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          >
            Xoá tất cả
          </Button>
        </div>
      </div>
    </div>
  );
}
