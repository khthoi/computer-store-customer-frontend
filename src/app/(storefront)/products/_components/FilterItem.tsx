"use client";

import { Select, Slider, Toggle } from "@/src/components/ui";
import { formatVND } from "@/src/lib/format";
import type { FilterDefinition, FilterValue } from "../_config";

export function isFilterActive(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return true;
  if (typeof value === "string") return value !== "";
  if (Array.isArray(value)) {
    if (value.length === 0) return false;
    if (typeof value[0] === "number") return true;
    return value.length > 0;
  }
  return false;
}

export function FilterItem({
  def,
  value,
  onChange,
}: {
  def: FilterDefinition;
  value: FilterValue | undefined;
  onChange: (v: FilterValue | undefined) => void;
}) {
  switch (def.type) {
    case "select":
      return (
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-secondary-600">
            {def.label}
          </label>
          <Select
            options={def.options ?? []}
            value={typeof value === "string" ? value : ""}
            onChange={(v) => {
              const str = v as string;
              onChange(str ? str : undefined);
            }}
            placeholder="Tất cả"
            clearable
            size="sm"
          />
        </div>
      );

    case "dropdown":
      return (
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-secondary-600">
            {def.label}
          </label>
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
        </div>
      );

    case "checkbox":
      return (
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-secondary-600">
            {def.label}
          </label>
          <Select
            options={def.options ?? []}
            value={(value as string[]) ?? []}
            onChange={(v) => {
              const arr = v as string[];
              onChange(arr.length > 0 ? arr : undefined);
            }}
            placeholder="Tất cả"
            multiple
            clearable
            showSelectedInTrigger={false}
            size="sm"
          />
        </div>
      );

    case "range":
      return (
        <div className="min-w-0 col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1">
          <label className="mb-1 block text-xs font-medium text-secondary-600">
            {def.label}
          </label>
          <div className="space-y-1">
            <Slider
              min={def.min ?? 0}
              max={def.max ?? 100}
              step={def.step ?? 1}
              value={
                (value as [number, number]) ?? [def.min ?? 0, def.max ?? 100]
              }
              onChange={(v: number | [number, number]) =>
                onChange(v as [number, number])
              }
              range
              size="sm"
              unit={def.unit}
              formatValue={
                def.unit === "₫"
                  ? (v: number) => formatVND(v)
                  : def.unit
                    ? (v: number) => `${v} ${def.unit}`
                    : undefined
              }
              showTooltip
            />
            <div className="flex justify-between text-[10px] text-secondary-400">
              <span>
                {def.unit === "₫"
                  ? formatVND(def.min ?? 0)
                  : `${def.min ?? 0} ${def.unit ?? ""}`}
              </span>
              <span>
                {def.unit === "₫"
                  ? formatVND(def.max ?? 100)
                  : `${def.max ?? 100} ${def.unit ?? ""}`}
              </span>
            </div>
          </div>
        </div>
      );

    case "toggle":
      return (
        <div className="min-w-0">
          <Toggle
            label={def.label}
            checked={(value as boolean) ?? false}
            onChange={(e) => onChange(e.target.checked || undefined)}
            size="sm"
            description={def.description}
            labelTop
          />
        </div>
      );

    case "rating":
      return (
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-secondary-600">
            {def.label}
          </label>
          <Select
            options={[
              { value: "5", label: "5 sao" },
              { value: "4", label: "Từ 4 sao" },
              { value: "3", label: "Từ 3 sao" },
              { value: "2", label: "Từ 2 sao" },
              { value: "1", label: "Từ 1 sao" },
            ]}
            value={value !== undefined ? String(value) : ""}
            onChange={(v) => {
              const str = v as string;
              onChange(str ? Number(str) : undefined);
            }}
            placeholder="Tất cả"
            clearable
            size="sm"
          />
        </div>
      );

    default:
      return null;
  }
}
