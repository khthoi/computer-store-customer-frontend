"use client";

import { formatVND } from "@/src/lib/format";
import type { ShippingMethod } from "@/src/store/checkout.store";

// ─── MethodCard ───────────────────────────────────────────────────────────────
//
// Shared radio-card sub-component. Used by both ShippingMethodSelector and
// PaymentMethodSelector. Renders a styled bordered card that wraps a visually
// hidden radio input, so the entire card is keyboard- and screen-reader-friendly.

export interface MethodCardProps {
  id: string;
  /** `name` attribute on the radio input — groups cards into a radio set. */
  groupName: string;
  title: string;
  description?: string;
  selected: boolean;
  onChange: () => void;
  /** Optional slot for price, icons, or badges on the trailing edge. */
  trailing?: React.ReactNode;
}

export function MethodCard({
  id,
  groupName,
  title,
  description,
  selected,
  onChange,
  trailing,
}: MethodCardProps) {
  return (
    <label
      htmlFor={id}
      className={[
        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors duration-150",
        selected
          ? "border-primary-500 bg-primary-50"
          : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50",
      ].join(" ")}
    >
      {/* Visually hidden radio — full card is the click target */}
      <input
        type="radio"
        id={id}
        name={groupName}
        className="sr-only"
        checked={selected}
        onChange={onChange}
      />

      {/* Custom radio dot */}
      <div
        aria-hidden="true"
        className={[
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
          selected ? "border-primary-600" : "border-secondary-300",
        ].join(" ")}
      >
        {selected && (
          <div className="h-2 w-2 rounded-full bg-primary-600" />
        )}
      </div>

      {/* Label block */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-secondary-500">{description}</p>
        )}
      </div>

      {/* Trailing slot */}
      {trailing && <div className="shrink-0 self-center">{trailing}</div>}
    </label>
  );
}

// ─── ShippingMethodSelector ───────────────────────────────────────────────────

export interface ShippingMethodSelectorProps {
  options: ShippingMethod[];
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function ShippingMethodSelector({
  options,
  selectedId,
  onChange,
}: ShippingMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-secondary-900">
        Phương thức vận chuyển
      </h2>

      <fieldset>
        <legend className="sr-only">Chọn phương thức vận chuyển</legend>
        <div className="space-y-2">
          {options.map((method) => (
            <MethodCard
              key={method.id}
              id={`shipping-${method.id}`}
              groupName="shipping"
              title={method.name}
              description={`${method.description} · ${method.estimatedDays}`}
              selected={selectedId === method.id}
              onChange={() => onChange(method.id)}
              trailing={
                <span
                  className={[
                    "text-sm font-semibold",
                    method.price === 0 ? "text-success-600" : "text-secondary-900",
                  ].join(" ")}
                >
                  {method.price === 0 ? "Miễn phí" : formatVND(method.price)}
                </span>
              }
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
