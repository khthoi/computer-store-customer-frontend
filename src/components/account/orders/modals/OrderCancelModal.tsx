"use client";

import { useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Select, type SelectOption } from "@/src/components/ui/Select";

// ─── Constants ────────────────────────────────────────────────────────────────

const CANCEL_REASON_OPTIONS: SelectOption[] = [
  { value: "change-address",    label: "Tôi muốn thay đổi địa chỉ giao hàng" },
  { value: "change-items",      label: "Tôi muốn thay đổi sản phẩm / số lượng" },
  { value: "better-price",      label: "Tôi tìm được giá tốt hơn ở nơi khác" },
  { value: "slow-delivery",     label: "Thời gian giao hàng quá lâu" },
  { value: "wrong-order",       label: "Tôi đặt nhầm sản phẩm" },
  { value: "other",             label: "Lý do khác" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the selected reason label when the user confirms cancellation. */
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * OrderCancelModal — confirmation dialog for order cancellation.
 *
 * Uses the shared `Select` component in single-select mode for the reason picker.
 * Confirm button is disabled until a reason is selected.
 * An inline error message appears if the user attempts to confirm without a selection.
 */
export function OrderCancelModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: OrderCancelModalProps) {
  const [reasonValue, setReasonValue] = useState("");
  const [touched, setTouched] = useState(false);

  const showError = touched && !reasonValue;

  const handleConfirm = () => {
    setTouched(true);
    if (!reasonValue) return;
    const label =
      CANCEL_REASON_OPTIONS.find((o) => o.value === reasonValue)?.label ??
      reasonValue;
    onConfirm(label);
  };

  const handleClose = () => {
    setReasonValue("");
    setTouched(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hủy đơn hàng"
      size="lg"
      animated
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={handleClose}
            disabled={isLoading}
          >
            Không hủy
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={handleConfirm}
            isLoading={isLoading}
          >
            Xác nhận hủy
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-secondary-600">
          Sau khi hủy, đơn hàng sẽ không thể khôi phục. Vui lòng chọn lý do
          hủy đơn:
        </p>

        <Select
          label="Lý do hủy"
          options={CANCEL_REASON_OPTIONS}
          value={reasonValue}
          onChange={(v) => {
            setReasonValue(v as string);
            setTouched(true);
          }}
          placeholder="-- Chọn lý do --"
          clearable
          errorMessage={showError ? "Vui lòng chọn lý do hủy đơn." : undefined}
        />
      </div>
    </Modal>
  );
}
