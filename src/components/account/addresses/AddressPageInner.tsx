"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { ToastMessage } from "@/src/components/ui/Toast";
import { AddressCard } from "@/src/components/account/addresses/AddressCard";
import { AddressFormModal } from "@/src/components/account/addresses/AddressFormModal";
import { DeleteAddressDialog } from "@/src/components/account/addresses/DeleteAddressDialog";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/src/services/account-address.service";
import type { Address } from "@/src/types/account-address.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AddressFormData = Omit<Address, "id" | "isDefault"> & { isDefault: boolean };

export interface AddressPageInnerProps {
  initialAddresses: Address[];
}

const MAX_ADDRESSES = 3;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AddressPageInner — client root for /account/addresses.
 *
 * Manages full local CRUD on the address list with optimistic updates
 * and a toast notification after each mutation.
 */
export function AddressPageInner({ initialAddresses }: AddressPageInnerProps) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ visible: true, type, message });
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormModalOpen(true);
  };

  const handleAddNew = () => {
    if (addresses.length >= MAX_ADDRESSES) {
      showToast(
        "error",
        `Bạn chỉ có thể lưu tối đa ${MAX_ADDRESSES} địa chỉ giao hàng. Hãy xóa bớt địa chỉ cũ trước khi thêm mới.`,
      );
      return;
    }
    setEditingAddress(null);
    setFormModalOpen(true);
  };

  const handleFormSave = useCallback(
    async (data: AddressFormData, id?: string) => {
      setIsSaving(true);
      try {
        let saved: Address;
        if (id) {
          saved = await updateAddress(id, data);
          if (data.isDefault) {
            saved = await setDefaultAddress(id);
          }
        } else {
          saved = await createAddress(data);
          if (data.isDefault && !saved.isDefault) {
            saved = await setDefaultAddress(saved.id);
          }
        }

        setAddresses((prev) => {
          const exists = prev.some((a) => a.id === saved.id);
          let next = exists
            ? prev.map((a) => (a.id === saved.id ? saved : a))
            : [...prev, saved];
          if (saved.isDefault) {
            next = next.map((a) => ({ ...a, isDefault: a.id === saved.id }));
          }
          return next;
        });

        setFormModalOpen(false);
        showToast("success", id ? "Địa chỉ đã được cập nhật." : "Địa chỉ mới đã được thêm.");
        router.refresh();
      } catch (err) {
        showToast(
          "error",
          err instanceof Error ? err.message : "Lưu địa chỉ thất bại.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [router],
  );

  const handleDeleteRequest = (address: Address) => {
    setDeletingAddress(address);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = useCallback(
    async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteAddress(id);
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        setDeleteDialogOpen(false);
        showToast("success", "Địa chỉ đã được xóa.");
        router.refresh();
      } catch (err) {
        showToast(
          "error",
          err instanceof Error ? err.message : "Xóa địa chỉ thất bại.",
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [router],
  );

  const handleSetDefault = useCallback(
    async (id: string) => {
      try {
        await setDefaultAddress(id);
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id })),
        );
        showToast("success", "Đã đặt địa chỉ mặc định.");
        router.refresh();
      } catch (err) {
        showToast(
          "error",
          err instanceof Error ? err.message : "Cập nhật mặc định thất bại.",
        );
      }
    },
    [router],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-bold text-secondary-900">
            Địa chỉ giao hàng
          </h1>
          <span
            className={[
              "text-xs font-medium tabular-nums",
              addresses.length >= MAX_ADDRESSES
                ? "text-error-600"
                : "text-secondary-500",
            ].join(" ")}
            aria-label={`Đang dùng ${addresses.length} trên ${MAX_ADDRESSES} địa chỉ`}
          >
            ({addresses.length}/{MAX_ADDRESSES})
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<PlusIcon />}
          onClick={handleAddNew}
          disabled={addresses.length >= MAX_ADDRESSES}
          title={
            addresses.length >= MAX_ADDRESSES
              ? `Tối đa ${MAX_ADDRESSES} địa chỉ — hãy xóa bớt để thêm mới`
              : undefined
          }
        >
          Thêm địa chỉ
        </Button>
      </div>

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-secondary-400">
          <p className="text-sm">Bạn chưa có địa chỉ nào.</p>
          <Button variant="outline" size="sm" onClick={handleAddNew}>
            Thêm địa chỉ đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      <AddressFormModal
        address={editingAddress}
        isOpen={formModalOpen}
        isLoading={isSaving}
        onClose={() => setFormModalOpen(false)}
        onSave={handleFormSave}
      />

      {/* Delete dialog */}
      <DeleteAddressDialog
        address={deletingAddress}
        isOpen={deleteDialogOpen}
        isLoading={isDeleting}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Toast */}
      <ToastMessage
        isVisible={toast.visible}
        type={toast.type}
        message={toast.message}
        position="top-right"
        duration={3500}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
