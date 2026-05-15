"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { PartPickerModal } from "@/src/components/buildpc/PartPickerModal";
import type { PartPickerProduct } from "@/src/components/buildpc/PartPickerModal";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Select } from "@/src/components/ui/Select";
import { Slider } from "@/src/components/ui/Slider";
import { Toggle } from "@/src/components/ui/Toggle";
import {
  getBuildPCProductList,
  type BuildPCProduct,
} from "@/src/services/storefront-buildpc.service";
import {
  getCategoryFacets,
  type StorefrontFacetGroup,
  type StorefrontFacetType,
} from "@/src/services/storefront-catalog-meta.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BuildPCPartPickerProps {
  isOpen: boolean;
  onClose: () => void;
  slotLabel: string;
  categoryId: number | null;
  categorySlug: string | null;
  selectedId?: string;
  selectedVariantValue?: string;
  onSelect: (product: PartPickerProduct, variantValue?: string) => void;
}

type CheckboxState = Record<number, string[]>;
type RangeState = Record<number, [number, number]>;
type ToggleState = Record<number, boolean>;
type SelectState = Record<number, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Spec values are stored in the DB as rich-text HTML (e.g. "<p>Đen</p>").
 * Facet labels render as plain text, so we strip tags + decode common entities
 * before showing them in checkboxes / selects.
 */
function stripHtml(input: string): string {
  if (!input) return "";
  const noTags = input.replace(/<[^>]*>/g, " ");
  const decoded = noTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
  return decoded.replace(/\s+/g, " ").trim();
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapToPartPickerProduct(p: BuildPCProduct): PartPickerProduct {
  const def = p.variants.find((v) => v.isDefault) ?? p.variants[0];
  const defPrice = def?.price ?? 0;
  const defOriginal = def?.originalPrice && def.originalPrice > defPrice
    ? def.originalPrice
    : undefined;

  const totalStock = p.totalStock;
  const availability: PartPickerProduct["availability"] =
    totalStock <= 0 ? "out-of-stock" : totalStock <= 5 ? "limited" : "in-stock";

  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    thumbnail: p.thumbnail || "https://placehold.co/80x80/f1f5f9/334155?text=PC",
    price: defPrice,
    originalPrice: defOriginal,
    availability,
    stockQuantity: totalStock,
    href: `/products/${p.slug}`,
    variants: p.variants.map((v) => ({
      value: v.id,
      label: v.name || v.sku,
      stock: v.stock,
      price: v.price,
      originalPrice:
        v.originalPrice && v.originalPrice > v.price ? v.originalPrice : undefined,
    })),
  };
}

function buildSpecsParam(
  facets: StorefrontFacetGroup[],
  checkboxes: CheckboxState,
  ranges: RangeState,
  toggles: ToggleState,
  selects: SelectState,
): string[] {
  const out: string[] = [];
  for (const group of facets) {
    for (const t of group.types) {
      const id = t.specTypeId;
      if (t.widget === "checkbox") {
        const vals = checkboxes[id];
        if (vals?.length) out.push(`${id}:${vals.join(",")}`);
      } else if (t.widget === "range") {
        const r = ranges[id];
        if (
          r &&
          (t.min === undefined || r[0] > t.min || (t.max !== undefined && r[1] < t.max))
        ) {
          out.push(`${id}:${r[0]}..${r[1]}`);
        }
      } else if (t.widget === "toggle") {
        if (toggles[id]) out.push(`${id}:true`);
      } else if (t.widget === "select") {
        const v = selects[id];
        if (v) out.push(`${id}:${v}`);
      }
    }
  }
  return out;
}

// ─── Facet panel ──────────────────────────────────────────────────────────────

function FacetGroupBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-secondary-500">
        {title}
      </p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

interface FacetPanelProps {
  facets: StorefrontFacetGroup[];
  checkboxes: CheckboxState;
  ranges: RangeState;
  toggles: ToggleState;
  selects: SelectState;
  onCheckboxToggle: (id: number, value: string) => void;
  onRangeChange: (id: number, value: [number, number]) => void;
  onToggleChange: (id: number, value: boolean) => void;
  onSelectChange: (id: number, value: string) => void;
}

function FacetPanel({
  facets,
  checkboxes,
  ranges,
  toggles,
  selects,
  onCheckboxToggle,
  onRangeChange,
  onToggleChange,
  onSelectChange,
}: FacetPanelProps) {
  if (facets.length === 0) return null;

  return (
    <>
      {facets.map((group) => (
        <FacetGroupBlock key={group.id} title={stripHtml(group.label)}>
          {group.types.map((t) => renderFacetType(t, {
            checkboxes,
            ranges,
            toggles,
            selects,
            onCheckboxToggle,
            onRangeChange,
            onToggleChange,
            onSelectChange,
          }))}
        </FacetGroupBlock>
      ))}
    </>
  );
}

function renderFacetType(
  t: StorefrontFacetType,
  h: Omit<FacetPanelProps, "facets">,
): ReactNode {
  const id = t.specTypeId;

  if (t.widget === "checkbox") {
    const selected = h.checkboxes[id] ?? [];
    return (
      <div key={t.key} className="mb-3 last:mb-0">
        <p className="mb-1.5 text-[11px] font-medium text-secondary-600">
          {stripHtml(t.label)}
          {t.unit ? ` (${t.unit})` : ""}
        </p>
        <div className="flex flex-col gap-1.5">
          {(t.options ?? []).map((opt) => (
            <Checkbox
              key={opt.value}
              label={`${stripHtml(opt.label)}${opt.count ? ` (${opt.count})` : ""}`}
              checked={selected.includes(opt.value)}
              onChange={() => h.onCheckboxToggle(id, opt.value)}
              size="sm"
            />
          ))}
        </div>
      </div>
    );
  }

  if (t.widget === "range") {
    const min = t.min ?? 0;
    const max = t.max ?? 100;
    const step = t.step ?? 1;
    const current = h.ranges[id] ?? [min, max];
    return (
      <div key={t.key} className="mb-3 last:mb-0">
        <p className="mb-1.5 text-[11px] font-medium text-secondary-600">
          {stripHtml(t.label)}
          {t.unit ? ` (${t.unit})` : ""}
        </p>
        <Slider
          min={min}
          max={max}
          step={step}
          value={current}
          range
          size="sm"
          unit={t.unit ?? undefined}
          onChange={(v) =>
            Array.isArray(v) && h.onRangeChange(id, [v[0], v[1]])
          }
        />
        <div className="mt-1 flex justify-between text-[10px] text-secondary-500">
          <span>{current[0]}{t.unit ? ` ${t.unit}` : ""}</span>
          <span>{current[1]}{t.unit ? ` ${t.unit}` : ""}</span>
        </div>
      </div>
    );
  }

  if (t.widget === "toggle") {
    return (
      <div key={t.key} className="mb-2 last:mb-0">
        <Toggle
          label={stripHtml(t.label)}
          checked={h.toggles[id] ?? false}
          onChange={(e) => h.onToggleChange(id, e.target.checked)}
          size="sm"
        />
      </div>
    );
  }

  if (t.widget === "select") {
    const opts = (t.options ?? []).map((o) => {
      const cleanLabel = stripHtml(o.label);
      return {
        value: o.value,
        label: o.count ? `${cleanLabel} (${o.count})` : cleanLabel,
      };
    });
    const current = h.selects[id];
    return (
      <div key={t.key} className="mb-3 last:mb-0">
        <p className="mb-1.5 text-[11px] font-medium text-secondary-600">
          {stripHtml(t.label)}
          {t.unit ? ` (${t.unit})` : ""}
        </p>
        <Select
          options={opts}
          value={current ? [current] : []}
          onChange={(vals) => h.onSelectChange(id, vals[0] ?? "")}
          size="sm"
          placeholder="Tất cả"
        />
      </div>
    );
  }

  return null;
}

// ─── Wrapper component ───────────────────────────────────────────────────────

const PRODUCTS_FETCH_LIMIT = 100;

export function BuildPCPartPicker({
  isOpen,
  onClose,
  slotLabel,
  categoryId,
  categorySlug,
  selectedId,
  selectedVariantValue,
  onSelect,
}: BuildPCPartPickerProps) {
  const [facets, setFacets] = useState<StorefrontFacetGroup[]>([]);
  const [products, setProducts] = useState<PartPickerProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [checkboxes, setCheckboxes] = useState<CheckboxState>({});
  const [ranges, setRanges] = useState<RangeState>({});
  const [toggles, setToggles] = useState<ToggleState>({});
  const [selects, setSelects] = useState<SelectState>({});
  const [inStockOnly, setInStockOnly] = useState(false);

  // Reset filters when slot/category changes
  useEffect(() => {
    setCheckboxes({});
    setRanges({});
    setToggles({});
    setSelects({});
    setInStockOnly(false);
  }, [categoryId]);

  // Fetch facets when the picker opens for a new category
  useEffect(() => {
    if (!isOpen || !categorySlug) {
      setFacets([]);
      return;
    }
    let cancelled = false;
    getCategoryFacets(categorySlug)
      .then((data) => {
        if (cancelled) return;
        setFacets(data);
      })
      .catch(() => {
        if (cancelled) return;
        setFacets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, categorySlug]);

  // Fetch products when category or filters change
  const specsParam = useMemo(
    () => buildSpecsParam(facets, checkboxes, ranges, toggles, selects),
    [facets, checkboxes, ranges, toggles, selects],
  );

  useEffect(() => {
    if (!isOpen || !categoryId) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      getBuildPCProductList({
        categoryId,
        page: 1,
        limit: PRODUCTS_FETCH_LIMIT,
        specs: specsParam.length ? specsParam : undefined,
        inStock: inStockOnly || undefined,
      })
        .then((res) => {
          if (cancelled) return;
          setProducts(res.items.map(mapToPartPickerProduct));
        })
        .catch(() => {
          if (cancelled) return;
          setProducts([]);
        })
        .finally(() => {
          if (cancelled) return;
          setLoading(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, categoryId, specsParam, inStockOnly]);

  // Filter handlers
  const handleCheckboxToggle = useCallback((id: number, value: string) => {
    setCheckboxes((prev) => {
      const cur = prev[id] ?? [];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...prev, [id]: next };
    });
  }, []);

  const handleRangeChange = useCallback((id: number, value: [number, number]) => {
    setRanges((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleToggleChange = useCallback((id: number, value: boolean) => {
    setToggles((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSelectChange = useCallback((id: number, value: string) => {
    setSelects((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSelect = useCallback(
    (id: string, variantValue?: string) => {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      onSelect(product, variantValue);
    },
    [products, onSelect],
  );

  const extraFilters = (
    <FacetPanel
      facets={facets}
      checkboxes={checkboxes}
      ranges={ranges}
      toggles={toggles}
      selects={selects}
      onCheckboxToggle={handleCheckboxToggle}
      onRangeChange={handleRangeChange}
      onToggleChange={handleToggleChange}
      onSelectChange={handleSelectChange}
    />
  );

  return (
    <PartPickerModal
      isOpen={isOpen}
      onClose={onClose}
      categoryLabel={slotLabel}
      products={products}
      selectedId={selectedId}
      selectedVariantValue={selectedVariantValue}
      onSelect={handleSelect}
      inStockOnly={inStockOnly}
      onInStockOnlyChange={setInStockOnly}
      extraFilters={extraFilters}
      isLoading={loading}
    />
  );
}
