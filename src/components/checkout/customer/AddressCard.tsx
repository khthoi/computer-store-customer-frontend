"use client";

import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { SavedAddress } from "@/src/store/checkout.store";

// ─── Component ────────────────────────────────────────────────────────────────

export interface AddressCardProps {
  address: SavedAddress;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * AddressCard — radio-style card for a saved shipping address.
 *
 * The entire card acts as the selection target (clicking it calls onSelect).
 * Edit and Delete icon buttons live in the top-right corner and stop
 * propagation so they don't also trigger selection.
 */
export function AddressCard({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: AddressCardProps) {
  const fullAddress = [
    address.addressDetail,
    address.ward,
    address.district,
    address.province,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={[
        "relative flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        selected
          ? "border-primary-500 bg-primary-50"
          : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50",
      ].join(" ")}
    >
      {/* Custom radio dot */}
      <div
        aria-hidden="true"
        className={[
          "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
          selected ? "border-primary-600" : "border-secondary-300",
        ].join(" ")}
      >
        {selected && <div className="h-2 w-2 rounded-full bg-primary-600" />}
      </div>

      {/* Address details */}
      <div className="flex-1 min-w-0 pr-14">
        <p className="text-sm font-medium text-secondary-900">
          {address.fullName}
          {address.isDefault && (
            <span className="ml-2 inline-flex items-center rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-semibold text-primary-700 uppercase tracking-wide">
              Mặc định
            </span>
          )}
        </p>
        <p className="text-xs text-secondary-500 mt-0.5">
          {address.phone} · {address.email}
        </p>
        <p className="text-xs text-secondary-600 mt-0.5 line-clamp-2">
          {fullAddress}
        </p>
      </div>

      {/* Edit / Delete actions */}
      <div className="absolute right-3 top-3 flex items-center gap-1">
        <button
          type="button"
          aria-label="Chỉnh sửa địa chỉ"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <PencilIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Xóa địa chỉ"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-7 w-7 items-center justify-center rounded text-secondary-400 hover:bg-error-50 hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
        >
          <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
