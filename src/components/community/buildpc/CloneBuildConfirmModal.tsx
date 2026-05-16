"use client";

import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";

interface CloneBuildConfirmModalProps {
  isOpen: boolean;
  buildName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function CloneBuildConfirmModal({
  isOpen,
  buildName,
  onCancel,
  onConfirm,
  loading = false,
}: CloneBuildConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) onCancel();
      }}
      title="Clone cấu hình về tài khoản"
      size="sm"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={loading}>
            Huỷ
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={loading}
            disabled={loading}
          >
            Xác nhận clone
          </Button>
        </div>
      }
    >
      <p className="text-sm text-secondary-700">
        Cấu hình{" "}
        <span className="font-semibold text-secondary-900">
          &ldquo;{buildName}&rdquo;
        </span>{" "}
        sẽ được sao chép vào danh sách của bạn dưới dạng nháp.
      </p>
      <p className="mt-2 text-sm text-secondary-500">
        Bạn có thể chỉnh sửa, đổi tên hoặc xoá sau khi clone.
      </p>
    </Modal>
  );
}
