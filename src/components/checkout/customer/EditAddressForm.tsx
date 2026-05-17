"use client";

import { useState, useCallback, useEffect } from "react";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { validateAddress, type AddressErrors } from "@/src/lib/validateAddress";
import type { SavedAddress } from "@/src/store/checkout.store";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EditAddressFormProps {
  /** null = create new; non-null = edit existing */
  address: SavedAddress | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (addr: SavedAddress) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyForm(): Omit<SavedAddress, "id"> {
  return {
    fullName: "",
    phone: "",
    email: "",
    province: "",
    district: "",
    ward: "",
    addressDetail: "",
    isDefault: false,
  };
}

function addrToForm(addr: SavedAddress): Omit<SavedAddress, "id"> {
  const { id: _id, ...rest } = addr;
  return rest;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * EditAddressForm — create/edit a saved address inside an animated Modal.
 *
 * Purely local state; no store access. The parent passes `onSave` and calls
 * `addAddress` / `updateAddress` on the checkout store accordingly.
 */
export function EditAddressForm({
  address,
  isOpen,
  onClose,
  onSave,
}: EditAddressFormProps) {
  const isNew = address === null;

  const [form, setForm] = useState<Omit<SavedAddress, "id">>(
    address ? addrToForm(address) : emptyForm()
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when the modal opens (handles close-and-reopen of the same address
  // without a key change). The key={address?.id ?? "new"} on the parent handles
  // switching between different addresses via remount; this covers reopening the same.
  useEffect(() => {
    if (!isOpen) return;
    setForm(address ? addrToForm(address) : emptyForm());
    setErrors({});
  }, [isOpen, address]);

  const handleFieldChange = useCallback(
    (field: keyof Omit<SavedAddress, "id">) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = field === "isDefault" ? e.target.checked : e.target.value;
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => {
          if (!prev[field as keyof AddressErrors]) return prev;
          const next = { ...prev };
          delete next[field as keyof AddressErrors];
          return next;
        });
      },
    []
  );

  const handleSave = useCallback(async () => {
    const errs = validateAddress(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    // Brief simulated async so the loading state is visible.
    await new Promise<void>((r) => setTimeout(r, 500));

    const saved: SavedAddress = {
      id: address?.id ?? `addr-${Date.now()}`,
      ...form,
    };
    onSave(saved);
    setIsSaving(false);
    onClose();
  }, [address, form, onSave, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNew ? "Thêm địa chỉ mới" : "Chỉnh sửa địa chỉ"}
      size="2xl"
      animated
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={isSaving}
          >
            {isNew ? "Thêm địa chỉ" : "Lưu thay đổi"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          prefixIcon={<UserIcon />}
          value={form.fullName}
          onChange={handleFieldChange("fullName")}
          errorMessage={errors.fullName}
          fullWidth
        />

        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="0901 234 567"
          autoComplete="tel"
          prefixIcon={<PhoneIcon />}
          value={form.phone}
          onChange={handleFieldChange("phone")}
          errorMessage={errors.phone}
          fullWidth
        />

        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
          prefixIcon={<EnvelopeIcon />}
          value={form.email}
          onChange={handleFieldChange("email")}
          errorMessage={errors.email}
          fullWidth
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Tỉnh / Thành phố"
            placeholder="Hà Nội"
            autoComplete="address-level1"
            value={form.province}
            onChange={handleFieldChange("province")}
            errorMessage={errors.province}
            fullWidth
          />
          <Input
            label="Quận / Huyện"
            placeholder="Cầu Giấy"
            autoComplete="address-level2"
            value={form.district}
            onChange={handleFieldChange("district")}
            errorMessage={errors.district}
            fullWidth
          />
          <Input
            label="Phường / Xã"
            placeholder="Dịch Vọng"
            autoComplete="address-level3"
            value={form.ward}
            onChange={handleFieldChange("ward")}
            errorMessage={errors.ward}
            fullWidth
          />
        </div>

        <Input
          label="Địa chỉ cụ thể"
          placeholder="Số nhà, tên đường, ngõ / ngách…"
          autoComplete="street-address"
          prefixIcon={<MapPinIcon />}
          value={form.addressDetail}
          onChange={handleFieldChange("addressDetail")}
          errorMessage={errors.addressDetail}
          fullWidth
        />
      </div>
    </Modal>
  );
}
