"use client";

import { FunnelIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui";
import type {
  FilterDefinition,
  FilterState,
  FilterType,
  FilterValue,
} from "../_config";
import { FilterItem } from "./FilterItem";

/**
 * Column descriptor — each entry groups filters whose widget shares the
 * same interaction model. The order here is also the column order in the bar.
 * `widthClass` is the lg+ col-span (out of 12) — `range` and `checkbox` get
 * more horizontal room so slider handles / option lists don't crowd neighbours.
 */
const FILTER_GROUPS: ReadonlyArray<{
  id: string;
  title: string;
  types: ReadonlyArray<FilterType>;
  widthClass: string;
}> = [
  { id: "range", title: "Khoảng giá trị", types: ["range"], widthClass: "lg:col-span-3" },
  {
    id: "checkbox",
    title: "Lựa chọn nhiều",
    types: ["checkbox", "dropdown"],
    widthClass: "lg:col-span-3",
  },
  { id: "select", title: "Chọn một", types: ["select", "rating"], widthClass: "lg:col-span-3" },
  { id: "toggle", title: "Bật / tắt", types: ["toggle"], widthClass: "lg:col-span-3" },
];

export function HorizontalFilterBar({
  definitions,
  filters,
  onChange,
  onApply,
  onReset,
  isDirty,
}: {
  definitions: FilterDefinition[];
  filters: FilterState;
  onChange: (key: string, value: FilterValue | undefined) => void;
  /** Called when user explicitly commits the draft state. Optional for back-compat. */
  onApply?: () => void;
  /** Revert draft to last-committed state. Optional. */
  onReset?: () => void;
  /** Whether the draft differs from the committed state. */
  isDirty?: boolean;
}) {
  const groups = FILTER_GROUPS.map((g) => ({
    ...g,
    defs: definitions.filter((d) => g.types.includes(d.type)),
  })).filter((g) => g.defs.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-secondary-100">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-secondary-500" />
          <span className="text-sm font-semibold text-secondary-800">
            Bộ lọc tìm kiếm
          </span>
          {isDirty && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-medium text-warning-700 border border-warning-200">
              Có thay đổi chưa áp dụng
            </span>
          )}
        </div>
        {onApply && (
          <div className="flex items-center gap-2">
            {onReset && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onReset}
                disabled={!isDirty}
              >
                Đặt lại
              </Button>
            )}
            <Button
              size="sm"
              onClick={onApply}
              disabled={!isDirty}
            >
              Lọc
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-12">
        {groups.map((g) => (
          <div
            key={g.id}
            className={`min-w-0 space-y-3 ${g.widthClass} ${g.id === "range" ? "px-1" : ""}`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
              {g.title}
            </div>
            <div className="space-y-3">
              {g.defs.map((def) => (
                <FilterItem
                  key={def.key}
                  def={def}
                  value={filters[def.key]}
                  onChange={(v) => onChange(def.key, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
