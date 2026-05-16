"use client";

import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import type { Address } from "@/src/types/account-address.types";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
  onSetDefault: (id: string) => void;
}

/**
 * AddressCard — displays a single delivery address with edit / delete / set-default actions.
 */
export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const fullAddress = [
    address.street,
    address.ward,
    address.district,
    address.province,
  ].join(", ");

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-5 transition-shadow",
        address.isDefault
          ? "border-primary-300 shadow-sm shadow-primary-100"
          : "border-secondary-200",
      ].join(" ")}
    >
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-secondary-900">
            {address.fullName}
          </span>
          <span className="text-sm text-secondary-400">·</span>
          <span className="text-sm text-secondary-600">{address.phone}</span>
          {address.isDefault && (
            <Badge variant="primary" size="sm">
              Mặc định
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<PencilSquareIcon />}
            onClick={() => onEdit(address)}
            aria-label="Chỉnh sửa địa chỉ"
          >
            Sửa
          </Button>
          {!address.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<TrashIcon />}
              onClick={() => onDelete(address)}
              aria-label="Xóa địa chỉ"
              className="text-error-600 hover:text-error-700 hover:bg-error-50"
            >
              Xóa
            </Button>
          )}
        </div>
      </div>

      {/* Address line */}
      <p className="text-sm text-secondary-600 leading-relaxed">{fullAddress}</p>

      {/* Set-default link */}
      {!address.isDefault && (
        <button
          type="button"
          onClick={() => onSetDefault(address.id)}
          className="mt-3 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none"
        >
          Đặt làm địa chỉ mặc định
        </button>
      )}
    </div>
  );
}
