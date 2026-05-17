"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/src/components/ui/Input";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { AddressCard } from "@/src/components/checkout/customer/AddressCard";
import { EditAddressForm } from "@/src/components/checkout/customer/EditAddressForm";
import { validateAddress } from "@/src/lib/validateAddress";
import { useCheckout } from "@/src/store/checkout.store";
import type { CheckoutFormValues, SavedAddress } from "@/src/store/checkout.store";

// ─── Ref API ──────────────────────────────────────────────────────────────────

export interface CustomerInfoFormRef {
  /** Runs validation, sets error states, returns true if all fields pass. */
  validate: () => boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CustomerInfoForm — customer info fields backed by checkout store.
 *
 * When saved addresses are available, a selector is shown above the form.
 * Selecting an address fills the form and locks the fields (disabled).
 * Exposes a `validate()` method via `useImperativeHandle`.
 */
export const CustomerInfoForm = forwardRef<CustomerInfoFormRef>(
  function CustomerInfoForm(_, ref) {
    const {
      state,
      setField,
      selectAddress,
      addAddress,
      updateAddress,
      deleteAddress,
      showToast,
    } = useCheckout();
    const { form, savedAddresses, selectedAddressId } = state;

    // Local error state (not lifted to store — only needed during validation).
    const [errors, setErrors] = useState<
      Partial<Record<keyof CheckoutFormValues, string>>
    >({});

    // Address modal state
    const [editTarget, setEditTarget] = useState<SavedAddress | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SavedAddress | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAddressLocked = selectedAddressId !== null;

    // ── Auto-select default address on first hydration ────────────────────────
    // One-shot: fires when addressesHydrated first becomes true, then never again.
    // Using a ref flag (NOT selectedAddressId in deps) so the user can freely
    // switch to manual input without triggering re-selection.
    const hasAutoSelectedRef = useRef(false);

    useEffect(() => {
      if (hasAutoSelectedRef.current || !state.addressesHydrated) return;
      hasAutoSelectedRef.current = true;
      const defaultAddr = savedAddresses.find((a) => a.isDefault);
      if (defaultAddr) selectAddress(defaultAddr.id);
    }, [state.addressesHydrated, savedAddresses, selectAddress]);

    // ── Imperative handle ────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      validate() {
        const errs = validateAddress(form);
        setErrors(errs);
        return Object.keys(errs).length === 0;
      },
    }));

    // ── Field change handler ──────────────────────────────────────────────────

    const handleChange = useCallback(
      (field: keyof CheckoutFormValues) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
          setField(field, e.target.value);
          if (errors[field]) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next[field];
              return next;
            });
          }
        },
      [setField, errors]
    );

    // ── Address CRUD handlers ─────────────────────────────────────────────────

    const openAddNew = useCallback(() => {
      setEditTarget(null);
      setIsEditOpen(true);
    }, []);

    const openEdit = useCallback((addr: SavedAddress) => {
      setEditTarget(addr);
      setIsEditOpen(true);
    }, []);

    const openDelete = useCallback((addr: SavedAddress) => {
      setDeleteTarget(addr);
      setIsDeleteOpen(true);
    }, []);

    const handleSaveAddress = useCallback(
      (addr: SavedAddress) => {
        if (editTarget) {
          updateAddress(addr);
          showToast("Đã cập nhật địa chỉ.", "success");
        } else {
          addAddress(addr);
          showToast("Đã thêm địa chỉ mới.", "success");
        }
      },
      [editTarget, addAddress, updateAddress, showToast]
    );

    const handleConfirmDelete = useCallback(async () => {
      if (!deleteTarget || isDeleting) return;
      setIsDeleting(true);
      await new Promise<void>((r) => setTimeout(r, 500));
      deleteAddress(deleteTarget.id);
      showToast("Đã xóa địa chỉ.", "success");
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }, [deleteTarget, isDeleting, deleteAddress, showToast]);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-secondary-900">
          Thông tin khách hàng
        </h2>

        {/* ── Saved address selector ──────────────────────────────────────── */}
        {savedAddresses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-secondary-700">
                Địa chỉ đã lưu
              </p>
              <button
                type="button"
                onClick={() => selectAddress(null)}
                className={[
                  "text-xs transition-colors",
                  isAddressLocked
                    ? "text-primary-600 hover:underline cursor-pointer"
                    : "text-secondary-400 cursor-default pointer-events-none",
                ].join(" ")}
              >
                Nhập địa chỉ thủ công
              </button>
            </div>

            <div
              role="radiogroup"
              aria-label="Chọn địa chỉ đã lưu"
              className="space-y-2"
            >
              {savedAddresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  selected={selectedAddressId === addr.id}
                  onSelect={() => selectAddress(addr.id)}
                  onEdit={() => openEdit(addr)}
                  onDelete={() => openDelete(addr)}
                />
              ))}
            </div>

            {savedAddresses.length < 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openAddNew}
                leftIcon={<PlusIcon />}
              >
                Thêm địa chỉ
              </Button>
            )}

            {/* Divider */}
            <div className="border-t border-secondary-100 pt-1" />
          </div>
        )}

        {/* If no saved addresses yet, show an "Add" button at the top */}
        {savedAddresses.length === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openAddNew}
            leftIcon={<PlusIcon />}
          >
            Thêm địa chỉ đã lưu
          </Button>
        )}

        {/* ── Manual form fields ──────────────────────────────────────────── */}
        <div className="space-y-4">
          <Input
            label="Họ và tên"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            prefixIcon={<UserIcon />}
            value={form.fullName}
            onChange={handleChange("fullName")}
            errorMessage={errors.fullName}
            disabled={isAddressLocked}
            fullWidth
          />

          <Input
            label="Số điện thoại"
            type="tel"
            placeholder="0901 234 567"
            autoComplete="tel"
            prefixIcon={<PhoneIcon />}
            value={form.phone}
            onChange={handleChange("phone")}
            errorMessage={errors.phone}
            disabled={isAddressLocked}
            fullWidth
          />

          <Input
            label="Email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            prefixIcon={<EnvelopeIcon />}
            value={form.email}
            onChange={handleChange("email")}
            errorMessage={errors.email}
            disabled={isAddressLocked}
            fullWidth
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Tỉnh / Thành phố"
              placeholder="Hà Nội"
              autoComplete="address-level1"
              value={form.province}
              onChange={handleChange("province")}
              errorMessage={errors.province}
              disabled={isAddressLocked}
              fullWidth
            />
            <Input
              label="Quận / Huyện"
              placeholder="Cầu Giấy"
              autoComplete="address-level2"
              value={form.district}
              onChange={handleChange("district")}
              errorMessage={errors.district}
              disabled={isAddressLocked}
              fullWidth
            />
            <Input
              label="Phường / Xã"
              placeholder="Dịch Vọng"
              autoComplete="address-level3"
              value={form.ward}
              onChange={handleChange("ward")}
              errorMessage={errors.ward}
              disabled={isAddressLocked}
              fullWidth
            />
          </div>

          <Input
            label="Địa chỉ cụ thể"
            placeholder="Số nhà, tên đường, ngõ / ngách…"
            autoComplete="street-address"
            prefixIcon={<MapPinIcon />}
            value={form.addressDetail}
            onChange={handleChange("addressDetail")}
            errorMessage={errors.addressDetail}
            disabled={isAddressLocked}
            fullWidth
          />

          {/* Hide "save address" checkbox when using a saved address */}
          {!isAddressLocked && (
            <Checkbox
              label="Lưu địa chỉ này để dùng lần sau"
              checked={form.saveAddress}
              onChange={(e) => setField("saveAddress", e.target.checked)}
            />
          )}
        </div>

        {/* ── Edit / Add modal ────────────────────────────────────────────── */}
        <EditAddressForm
          key={editTarget?.id ?? "new"}
          address={editTarget}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSaveAddress}
        />

        {/* ── Delete confirmation modal ───────────────────────────────────── */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Xóa địa chỉ"
          size="sm"
          animated
          footer={
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleConfirmDelete}
                isLoading={isDeleting}
              >
                Xóa
              </Button>
            </>
          }
        >
          <p className="text-sm text-secondary-700">
            Bạn có chắc muốn xóa địa chỉ{" "}
            <span className="font-medium text-secondary-900">
              {deleteTarget?.fullName}
            </span>{" "}
            —{" "}
            <span className="font-medium text-secondary-900">
              {deleteTarget?.addressDetail}
            </span>
            ? Hành động này không thể hoàn tác.
          </p>
        </Modal>
      </div>
    );
  }
);
