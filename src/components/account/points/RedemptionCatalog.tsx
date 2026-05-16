"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GiftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { ToastMessage } from "@/src/components/ui/Toast";
import { redeemPoints } from "@/src/services/account-loyalty.service";
import type {
  RedemptionCatalogItem,
  RedemptionRecord,
} from "@/src/types/account-loyalty.types";

interface Props {
  balance: number;
  catalog: RedemptionCatalogItem[];
  recentRedemptions: RedemptionRecord[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function RedemptionCatalog({
  balance,
  catalog,
  recentRedemptions,
}: Props) {
  const router = useRouter();
  const [confirmItem, setConfirmItem] = useState<RedemptionCatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successCoupon, setSuccessCoupon] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const handleConfirmRedeem = async () => {
    if (!confirmItem) return;
    setSubmitting(true);
    try {
      const result = await redeemPoints(confirmItem.id);
      setSuccessCoupon(result.couponCode);
      setConfirmItem(null);
      router.refresh();
    } catch (err) {
      setToast({
        visible: true,
        type: "error",
        message: err instanceof Error ? err.message : "Đổi điểm thất bại.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCoupon = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setToast({
        visible: true,
        type: "success",
        message: `Đã sao chép mã ${code}.`,
      });
    } catch {
      setToast({
        visible: true,
        type: "error",
        message: "Không sao chép được mã.",
      });
    }
  };

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-secondary-900">
          Đổi điểm lấy ưu đãi
        </h2>
        <span className="text-xs text-secondary-400">
          Số dư: <strong>{balance.toLocaleString("vi-VN")}</strong> điểm
        </span>
      </div>

      {catalog.length === 0 ? (
        <p className="py-6 text-center text-sm text-secondary-400">
          Hiện chưa có phần thưởng nào để đổi.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {catalog.map((c) => {
            const enough = balance >= c.pointsRequired;
            const outOfStock =
              c.stockLimit != null && c.redeemed >= c.stockLimit;
            const disabled = !enough || outOfStock;
            return (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-xl border border-secondary-100 bg-secondary-50 p-3"
              >
                <div className="mt-0.5 rounded-lg bg-primary-100 p-2 text-primary-600">
                  <GiftIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-secondary-900">
                    {c.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {c.pointsRequired.toLocaleString("vi-VN")} điểm
                    {c.validUntil && ` · HSD ${formatDate(c.validUntil)}`}
                  </p>
                  {c.stockLimit != null && (
                    <p className="text-xs text-secondary-400">
                      Còn lại: {Math.max(0, c.stockLimit - c.redeemed)} /{" "}
                      {c.stockLimit}
                    </p>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    disabled={disabled}
                    onClick={() => setConfirmItem(c)}
                  >
                    {outOfStock
                      ? "Đã hết"
                      : !enough
                        ? "Chưa đủ điểm"
                        : "Đổi ngay"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {recentRedemptions.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-secondary-900">
            Phần thưởng đã đổi gần đây
          </h3>
          <ul className="divide-y divide-secondary-100">
            {recentRedemptions.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm text-secondary-700">
                    {r.catalogName}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {formatDate(r.redeemedAt)} · −{r.pointsSpent} điểm
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(r.couponCode)}
                  className="rounded border border-primary-300 px-2 py-1 text-xs font-mono font-semibold text-primary-700 hover:bg-primary-50"
                >
                  {r.couponCode}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={!!confirmItem}
        onClose={() => setConfirmItem(null)}
        title="Xác nhận đổi điểm"
      >
        {confirmItem && (
          <div className="space-y-3">
            <p className="text-sm text-secondary-700">
              Bạn sẽ dùng{" "}
              <strong>
                {confirmItem.pointsRequired.toLocaleString("vi-VN")} điểm
              </strong>{" "}
              để đổi phần thưởng:
            </p>
            <p className="rounded-lg bg-secondary-50 p-3 text-sm font-semibold text-secondary-900">
              {confirmItem.name}
            </p>
            <p className="text-xs text-secondary-400">
              Số dư sau khi đổi:{" "}
              {(balance - confirmItem.pointsRequired).toLocaleString("vi-VN")}{" "}
              điểm
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmItem(null)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmRedeem}
                isLoading={submitting}
              >
                Xác nhận đổi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!successCoupon}
        onClose={() => setSuccessCoupon(null)}
        title="Đổi điểm thành công"
      >
        {successCoupon && (
          <div className="space-y-3 text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-success-500" />
            <p className="text-sm text-secondary-700">
              Mã giảm giá của bạn:
            </p>
            <p className="rounded-lg border-2 border-dashed border-primary-400 bg-primary-50 p-3 font-mono text-lg font-bold text-primary-700">
              {successCoupon}
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleCopyCoupon(successCoupon)}
            >
              Sao chép mã
            </Button>
            <p className="text-xs text-secondary-400">
              Áp dụng mã này tại bước thanh toán đơn hàng.
            </p>
          </div>
        )}
      </Modal>

      <ToastMessage
        isVisible={toast.visible}
        type={toast.type}
        message={toast.message}
        position="bottom-right"
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}
