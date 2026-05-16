"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Lightbox, type LightboxItem } from "@/src/components/ui/Lightbox";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { ReturnStatusBadge } from "@/src/components/account/returns/ReturnStatusBadge";
import {
  RETURN_REASON_OPTIONS,
} from "@/src/types/account-return.types";
import type {
  ReturnRequest,
  ReturnStatus,
} from "@/src/types/account-return.types";
import type { OrderSummary } from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url);
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

interface TimelineStep {
  label: string;
  subLabel?: string;
}

interface StepStyle {
  circle: string;
  label: string;
  line: string;
}

function getStepStyle(
  index: number,
  activeIndex: number,
  status: ReturnStatus
): StepStyle {
  if (index < activeIndex) {
    // Completed step
    return {
      circle: "bg-primary-600 text-white",
      label: "text-secondary-700 font-medium",
      line: "bg-primary-400",
    };
  }
  if (index === activeIndex) {
    // Active step — colour changes for resolved states
    if (index === 2 && status === "approved") {
      return {
        circle: "bg-success-500 text-white ring-4 ring-success-100",
        label: "text-success-700 font-semibold",
        line: "",
      };
    }
    if (index === 2 && status === "rejected") {
      return {
        circle: "bg-error-500 text-white ring-4 ring-error-100",
        label: "text-error-700 font-semibold",
        line: "",
      };
    }
    return {
      circle: "bg-primary-600 text-white ring-4 ring-primary-100",
      label: "text-primary-700 font-semibold",
      line: "",
    };
  }
  // Future step
  return {
    circle: "bg-secondary-100 text-secondary-400 border border-secondary-200",
    label: "text-secondary-400",
    line: "bg-secondary-200",
  };
}

interface StatusTimelineProps {
  request: ReturnRequest;
}

function StatusTimeline({ request }: StatusTimelineProps) {
  const activeIndex: Record<ReturnStatus, number> = {
    submitted: 0,
    processing: 1,
    approved: 2,
    rejected: 2,
  };
  const active = activeIndex[request.status];

  const steps: TimelineStep[] = [
    { label: "Đã gửi", subLabel: formatDate(request.submittedAt) },
    { label: "Đang xem xét" },
    {
      label: request.status === "rejected" ? "Thất bại" : "Thành công",
      subLabel: request.resolvedAt ? formatDate(request.resolvedAt) : undefined,
    },
  ];

  return (
    <>
      {/* Desktop — horizontal */}
      <div className="hidden sm:flex items-start">
        {steps.map((step, i) => {
          const style = getStepStyle(i, active, request.status);
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex flex-1 items-start">
              {/* Left connector — mt-4 aligns the bar to the circle's vertical center */}
              {i > 0 && (
                <div
                  className={[
                    "mt-4 h-0.5 flex-1 transition-colors",
                    getStepStyle(i - 1, active, request.status).line ||
                      (i <= active ? "bg-primary-400" : "bg-secondary-200"),
                  ].join(" ")}
                />
              )}

              {/* Circle + label — always naturally centered over itself */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    style.circle,
                  ].join(" ")}
                >
                  {i < active ? (
                    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L6.75 9.19l4.97-4.97a.75.75 0 011.06 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>

                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <span className={["text-xs text-center", style.label].join(" ")}>
                    {step.label}
                  </span>
                  {step.subLabel && (
                    <span className="text-[10px] text-secondary-400">
                      {step.subLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Right connector */}
              {!isLast && (
                <div
                  className={[
                    "mt-4 h-0.5 flex-1 transition-colors",
                    i < active ? "bg-primary-400" : "bg-secondary-200",
                  ].join(" ")}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile — vertical */}
      <div className="flex flex-col gap-0 sm:hidden">
        {steps.map((step, i) => {
          const style = getStepStyle(i, active, request.status);
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex gap-3">
              {/* Left column: circle + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    style.circle,
                  ].join(" ")}
                >
                  {i < active ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                      <path fillRule="evenodd" d="M12.78 4.22a.75.75 0 010 1.06l-5.5 5.5a.75.75 0 01-1.06 0l-2.5-2.5a.75.75 0 011.06-1.06L6.75 9.19l4.97-4.97a.75.75 0 011.06 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {!isLast && (
                  <div
                    className={[
                      "my-0.5 w-0.5 flex-1",
                      i < active ? "bg-primary-400" : "bg-secondary-200",
                    ].join(" ")}
                    style={{ minHeight: "1.5rem" }}
                  />
                )}
              </div>

              {/* Right column: text */}
              <div className="pb-4 pt-0.5">
                <p className={["text-sm", style.label].join(" ")}>
                  {step.label}
                </p>
                {step.subLabel && (
                  <p className="text-xs text-secondary-400">{step.subLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReturnRequestDetailCardProps {
  request: ReturnRequest;
  order: OrderSummary;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReturnRequestDetailCard — full detail view of a submitted return request.
 * Shows status timeline, order info, selected products, reason, evidence, and
 * a conditional resolution callout.
 */
export function ReturnRequestDetailCard({
  request,
  order,
}: ReturnRequestDetailCardProps) {
  // Images and videos are handled separately:
  // - Images → Lightbox (full navigation between all image evidence)
  // - Videos → Modal (Lightbox is image-only)
  const imageUrls = request.evidenceUrls.filter((u) => !isVideo(u));
  const lightboxItems: LightboxItem[] = imageUrls.map((src, i) => ({
    key: `evidence-img-${i}`,
    src,
    alt: `Bằng chứng ${i + 1}`,
  }));

  const [lightboxImageIndex, setLightboxImageIndex] = useState<number | null>(null);
  const [lightboxVideoUrl, setLightboxVideoUrl] = useState<string | null>(null);

  const resolvedReason =
    RETURN_REASON_OPTIONS.find((opt) => opt.value === request.reason)?.label ??
    "—";

  const resolvedResolution =
    request.resolution === "exchange" ? "Đổi sản phẩm" : "Hoàn tiền";

  return (
    <div className="flex flex-col gap-5 px-6 py-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-secondary-400">Mã yêu cầu</p>
          <p className="font-mono text-lg font-bold text-secondary-900">
            {request.id}
          </p>
        </div>
        <ReturnStatusBadge status={request.status} />
      </div>

      {/* ── Status timeline ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-4">
        <StatusTimeline request={request} />
      </div>

      {/* ── Order info ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-secondary-200 p-4">
        <p className="text-sm text-secondary-600">
          Đơn hàng:{" "}
          <Tooltip content="Xem chi tiết đơn hàng" placement="top">
            <a
              href={`/account/orders/${order.numericId}`}
              className="font-semibold text-secondary-900 hover:text-primary-600 hover:underline underline-offset-2 transition-colors duration-150"
            >
              {order.id}
            </a>
          </Tooltip>
        </p>
        <p className="mt-1 text-sm text-secondary-600">
          Ngày đặt:{" "}
          <span className="font-medium text-secondary-900">
            {formatDate(order.placedAt)}
          </span>
        </p>
      </div>

      {/* ── Selected products ────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-semibold text-secondary-700">
          Sản phẩm trả hàng
        </p>
        <div className="flex flex-col gap-2">
          {request.items.map((si) => {
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

      {/* ── Reason & resolution ──────────────────────────────────────────────── */}
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
          <span className="text-sm leading-relaxed text-secondary-900">
            {request.description}
          </span>
        </div>
      </div>

      {/* ── Evidence gallery ─────────────────────────────────────────────────── */}
      {request.evidenceUrls.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold text-secondary-700">
            Bằng chứng ({request.evidenceUrls.length} file)
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {request.evidenceUrls.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (isVideo(url)) {
                    setLightboxVideoUrl(url);
                  } else {
                    // Find the index within image-only array for correct Lightbox navigation
                    setLightboxImageIndex(imageUrls.indexOf(url));
                  }
                }}
                className="relative aspect-square overflow-hidden rounded-lg border border-secondary-200 bg-secondary-100 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={`Xem bằng chứng ${idx + 1}`}
              >
                {isVideo(url) ? (
                  <>
                    <video
                      src={url}
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
                  <Image
                    src={url}
                    alt={`Bằng chứng ${idx + 1}`}
                    fill
                    sizes="(max-width: 640px) 25vw, 20vw"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Resolution callout ───────────────────────────────────────────────── */}
      {request.status === "approved" && (
        <div className="flex gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
          <CheckCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-success-500"
            aria-hidden="true"
          />
          <p className="text-sm text-success-700">
            Yêu cầu đã được chấp nhận. Chúng tôi sẽ liên hệ để sắp xếp{" "}
            <span className="font-semibold">đổi/hoàn tiền</span> trong thời gian
            sớm nhất.
          </p>
        </div>
      )}

      {request.status === "rejected" && (
        <div className="flex gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3">
          <XCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-error-500"
            aria-hidden="true"
          />
          <p className="text-sm text-error-700">
            {request.rejectionReason ??
              "Yêu cầu đổi/trả không được chấp nhận. Vui lòng liên hệ CSKH để biết thêm chi tiết."}
          </p>
        </div>
      )}

      {(request.status === "submitted" || request.status === "processing") && (
        <div className="flex gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
          <InformationCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-primary-500"
            aria-hidden="true"
          />
          <p className="text-sm text-primary-700">
            Bộ phận CSKH sẽ xem xét và phản hồi trong vòng{" "}
            <span className="font-semibold">1–2 ngày làm việc</span>.
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="border-t border-secondary-100 pt-2">
        <Link
          href="/account/orders"
          className="text-sm font-medium text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors"
        >
          ← Về trang đơn hàng
        </Link>
      </div>

      {/* ── Image lightbox — full navigation across all image evidence ─────── */}
      {lightboxImageIndex !== null && (
        <Lightbox
          items={lightboxItems}
          activeIndex={lightboxImageIndex}
          onClose={() => setLightboxImageIndex(null)}
          onNavigate={setLightboxImageIndex}
        />
      )}

      {/* ── Video modal — Lightbox is image-only; videos use Modal ───────── */}
      <Modal
        isOpen={lightboxVideoUrl !== null}
        onClose={() => setLightboxVideoUrl(null)}
        size="xl"
        animated
        hideCloseButton={false}
      >
        {lightboxVideoUrl && (
          <div className="flex items-center justify-center">
            <video
              src={lightboxVideoUrl}
              controls
              className="max-h-[70vh] w-full rounded"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
