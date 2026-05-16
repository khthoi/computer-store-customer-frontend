"use client";

import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import type { Address } from "@/src/types/account-address.types";

interface DeleteAddressDialogProps {
  address: Address | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

/**
 * DeleteAddressDialog — confirmation modal before removing an address.
 */
export function DeleteAddressDialog({
  address,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: DeleteAddressDialogProps) {
  if (!address) return null;

  const fullAddress = [
    address.street,
    address.ward,
    address.district,
    address.province,
  ].join(", ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa địa chỉ"
      size="md"
      animated
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => onConfirm(address.id)}
            isLoading={isLoading}
          >
            Xóa địa chỉ
          </Button>
        </>
      }
    >
      <p className="text-sm text-secondary-600">
        Bạn có chắc muốn xóa địa chỉ sau không?
      </p>
      <p className="mt-3 rounded-lg bg-secondary-50 px-4 py-3 text-sm text-secondary-800 leading-relaxed">
        {fullAddress}
      </p>
      <p className="mt-3 text-xs text-secondary-400">
        Hành động này không thể hoàn tác.
      </p>
    </Modal>
  );
}
