"use client";

import Image from "next/image";
import { InformationCircleIcon, PlayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import {
  RETURN_REASON_OPTIONS,
} from "@/src/types/account-return.types";
import type {
  WizardState,
} from "@/src/types/account-return.types";
import type { OrderDetail } from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step3Props {
  order: OrderDetail;
  state: WizardState;
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step3Confirmation({
  order,
  state,
  isSubmitting,
  onSubmit,
  onBack,
}: Step3Props) {
  const resolvedReason =
    RETURN_REASON_OPTIONS.find((opt) => opt.value === state.reason)?.label ??
    "—";

  const resolvedResolution =
    state.resolution === "exchange" ? "Đổi sản phẩm" : "Hoàn tiền";

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {/* ── Order info ────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-secondary-200 p-4">
        <p className="text-sm text-secondary-600">
          Đơn hàng:{" "}
          <span className="font-semibold text-secondary-900">
            {order.id}
          </span>
        </p>
        <p className="mt-1 text-sm text-secondary-600">
          Ngày đặt:{" "}
          <span className="font-medium text-secondary-900">
            {formatDate(order.placedAt)}
          </span>
        </p>
      </div>

      {/* ── Selected products ─────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-semibold text-secondary-700">
          Sản phẩm trả hàng
        </p>
        <div className="flex flex-col gap-2">
          {state.selectedItems.map((si) => {
            const item = order.items.find((i) => i.id === si.itemId);
            if (!item) return null;
            return (
              <div
                key={si.itemId}
                className="flex items-center gap-3 rounded-lg border border-secondary-200 p-3"
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-secondary-50">
                  <Image
                    src={item.thumbnailSrc}
                    alt={item.name}
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-secondary-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-secondary-400">
                    {item.variantLabel}
                  </p>
                </div>

                {/* Return qty */}
                <span className="shrink-0 text-sm text-secondary-600">
                  SL: {si.returnQuantity}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Reason & resolution ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-secondary-200 divide-y divide-secondary-100">
        <div className="flex items-start gap-2 px-4 py-3">
          <span className="shrink-0 text-sm text-secondary-500">Lý do:</span>
          <span className="text-sm font-medium text-secondary-900">
            {resolvedReason}
          </span>
        </div>
        <div className="flex items-start gap-2 px-4 py-3">
          <span className="shrink-0 text-sm text-secondary-500">
            Phương thức:
          </span>
          <span className="text-sm font-medium text-secondary-900">
            {resolvedResolution}
          </span>
        </div>
        <div className="flex items-start gap-2 px-4 py-3">
          <span className="shrink-0 text-sm text-secondary-500">Mô tả:</span>
          <span className="line-clamp-3 text-sm text-secondary-900">
            {state.description}
          </span>
        </div>
      </div>

      {/* ── Uploaded evidence ─────────────────────────────────────────────── */}
      {state.files.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-secondary-700">
            Bằng chứng ({state.files.length} file)
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {state.files.map((f) => (
              <div
                key={f.id}
                className="relative aspect-square overflow-hidden rounded-lg border border-secondary-200 bg-secondary-100"
              >
                {f.file.type.startsWith("video/") ? (
                  <>
                    <video
                      src={f.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayIcon
                        className="h-6 w-6 text-white drop-shadow"
                        aria-hidden="true"
                      />
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info note ─────────────────────────────────────────────────────── */}
      <div className="flex gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
        <InformationCircleIcon
          className="mt-0.5 h-5 w-5 shrink-0 text-primary-500"
          aria-hidden="true"
        />
        <p className="text-sm text-primary-700">
          Bộ phận CSKH sẽ liên hệ và xử lý yêu cầu trong vòng{" "}
          <span className="font-semibold">1–2 ngày làm việc</span>.
        </p>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between border-t border-secondary-100 pt-4">
        <Button
          variant="outline"
          size="md"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Quay lại
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onSubmit}
          isLoading={isSubmitting}
        >
          Gửi yêu cầu
        </Button>
      </div>
    </div>
  );
}
