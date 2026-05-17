"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";

// ─── Component ────────────────────────────────────────────────────────────────

export interface ReviewExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ReviewExpiredModal — informs the user that the 15-day review window has closed.
 */
export function ReviewExpiredModal({ isOpen, onClose }: ReviewExpiredModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      animated
      footer={
        <Button variant="primary" size="md" onClick={onClose}>
          Đã hiểu
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-50">
          <ExclamationTriangleIcon
            className="h-6 w-6 text-warning-500"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-secondary-900">
            Hết thời hạn đánh giá
          </h3>
          <p className="text-sm text-secondary-600">
            Tính năng đánh giá sản phẩm chỉ khả dụng trong vòng{" "}
            <span className="font-medium">15 ngày</span> kể từ ngày nhận hàng.
            Thời hạn của đơn hàng này đã kết thúc.
          </p>
          <p className="text-xs text-secondary-400">
            Cảm ơn bạn đã mua hàng! Chúng tôi mong được phục vụ bạn trong
            những đơn hàng tiếp theo.
          </p>
        </div>
      </div>
    </Modal>
  );
}
