"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Checkbox } from "@/src/components/ui/Checkbox";
import type { Address } from "@/src/types/account-address.types";

// ─── Types ────────────────────────────────────────────────────────────────────

type AddressFormData = Omit<Address, "id" | "isDefault"> & { isDefault: boolean };

interface AddressFormModalProps {
  /** null → "Add new", Address → "Edit" */
  address: Address | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData, id?: string) => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(data: AddressFormData): FormErrors {
  const errors: FormErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
  if (!data.phone.trim()) {
    errors.phone = "Vui lòng nhập số điện thoại.";
  } else if (!/^0\d{9}$/.test(data.phone)) {
    errors.phone = "Số điện thoại không hợp lệ.";
  }
  if (!data.province.trim()) errors.province = "Vui lòng nhập tỉnh / thành phố.";
  if (!data.district.trim()) errors.district = "Vui lòng nhập quận / huyện.";
  if (!data.ward.trim()) errors.ward = "Vui lòng nhập phường / xã.";
  if (!data.street.trim()) errors.street = "Vui lòng nhập địa chỉ cụ thể.";
  return errors;
}

const EMPTY_FORM: AddressFormData = {
  fullName: "",
  phone: "",
  province: "",
  district: "",
  ward: "",
  street: "",
  isDefault: false,
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AddressFormModal — add or edit an address.
 * Pre-fills from `address` prop when editing; resets to empty for new entries.
 */
export function AddressFormModal({
  address,
  isOpen,
  isLoading = false,
  onClose,
  onSave,
}: AddressFormModalProps) {
  const isEdit = address !== null;

  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // Sync form with the address prop whenever it changes (open/close)
  useEffect(() => {
    if (isOpen) {
      setForm(
        address
          ? {
              fullName: address.fullName,
              phone: address.phone,
              province: address.province,
              district: address.district,
              ward: address.ward,
              street: address.street,
              isDefault: address.isDefault,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setTouched(false);
    }
  }, [isOpen, address]);

  const set = (field: keyof AddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === "isDefault" ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (touched) setErrors(validate({ ...form, [field]: value }));
    };

  const handleSave = () => {
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave(form, address?.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
      size="2xl"
      animated
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} isLoading={isLoading}>
            {isEdit ? "Lưu thay đổi" : "Thêm địa chỉ"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Row: fullName + phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Họ và tên"
            value={form.fullName}
            onChange={set("fullName")}
            errorMessage={touched ? errors.fullName : undefined}
            placeholder="Nguyễn Văn An"
            fullWidth
          />
          <Input
            label="Số điện thoại"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            errorMessage={touched ? errors.phone : undefined}
            placeholder="0912345678"
            fullWidth
          />
        </div>

        {/* Province */}
        <Input
          label="Tỉnh / Thành phố"
          value={form.province}
          onChange={set("province")}
          errorMessage={touched ? errors.province : undefined}
          placeholder="TP. Hồ Chí Minh"
          fullWidth
        />

        {/* Row: district + ward */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Quận / Huyện"
            value={form.district}
            onChange={set("district")}
            errorMessage={touched ? errors.district : undefined}
            placeholder="Quận 1"
            fullWidth
          />
          <Input
            label="Phường / Xã"
            value={form.ward}
            onChange={set("ward")}
            errorMessage={touched ? errors.ward : undefined}
            placeholder="Phường Bến Nghé"
            fullWidth
          />
        </div>

        {/* Street */}
        <Input
          label="Địa chỉ cụ thể"
          value={form.street}
          onChange={set("street")}
          errorMessage={touched ? errors.street : undefined}
          placeholder="123 Đường Lê Lợi"
          fullWidth
        />

        {/* Default checkbox */}
        <Checkbox
          label="Đặt làm địa chỉ mặc định"
          checked={form.isDefault}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, isDefault: e.target.checked }))
          }
        />
      </div>
    </Modal>
  );
}
