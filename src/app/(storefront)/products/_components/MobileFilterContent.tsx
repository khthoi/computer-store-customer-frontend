"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui";
import type {
  FilterDefinition,
  FilterState,
  FilterType,
  FilterValue,
} from "../_config";
import { FilterItem, isFilterActive } from "./FilterItem";

const MOBILE_FILTER_GROUPS: ReadonlyArray<{
  id: string;
  title: string;
  types: ReadonlyArray<FilterType>;
}> = [
  { id: "range", title: "Khoảng giá trị", types: ["range"] },
  { id: "checkbox", title: "Lựa chọn nhiều", types: ["checkbox", "dropdown"] },
  { id: "select", title: "Chọn một", types: ["select", "rating"] },
  { id: "toggle", title: "Bật / tắt", types: ["toggle"] },
];

export function MobileFilterContent({
  definitions,
  filters,
  onChange,
  onClear,
}: {
  definitions: FilterDefinition[];
  filters: FilterState;
  onChange: (key: string, value: FilterValue | undefined) => void;
  onClear: () => void;
}) {
  const hasActive = definitions.some((d) => isFilterActive(filters[d.key]));

  const groups = MOBILE_FILTER_GROUPS.map((g) => ({
    ...g,
    defs: definitions.filter((d) => g.types.includes(d.type)),
  })).filter((g) => g.defs.length > 0);

  return (
    <div className="space-y-4">
      {hasActive && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="w-full text-error-600 hover:text-error-700 hover:bg-error-50"
        >
          <XMarkIcon className="w-4 h-4 mr-1" />
          Xoá tất cả bộ lọc
        </Button>
      )}

      <div className="space-y-6">
        {groups.map((g) => (
          <section key={g.id} className="space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-secondary-400">
              {g.title}
            </div>
            <div className={g.id === "range" ? "space-y-4 px-1" : "space-y-3"}>
              {g.defs.map((def) => (
                <div key={def.key} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-secondary-800">
                    {def.label}
                    {isFilterActive(filters[def.key]) && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <FilterItem
                    def={def}
                    value={filters[def.key]}
                    onChange={(v) => onChange(def.key, v)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
