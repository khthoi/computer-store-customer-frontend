import type { ReturnStatus } from "@/src/types/account-return.types";

// ─── Style map ────────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  containerClass: string;
  textClass: string;
  dotClass: string;
}

const STATUS_META: Record<ReturnStatus, StatusMeta> = {
  submitted: {
    label: "Đã gửi",
    containerClass: "bg-blue-50 border border-blue-200",
    textClass: "text-blue-700",
    dotClass: "bg-blue-500",
  },
  processing: {
    label: "Đang xem xét",
    containerClass: "bg-amber-50 border border-amber-200",
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "Thành công",
    containerClass: "bg-success-50 border border-success-200",
    textClass: "text-success-700",
    dotClass: "bg-success-500",
  },
  rejected: {
    label: "Thất bại",
    containerClass: "bg-error-50 border border-error-200",
    textClass: "text-error-700",
    dotClass: "bg-error-500",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface ReturnStatusBadgeProps {
  status: ReturnStatus;
}

/**
 * ReturnStatusBadge — pill chip showing the current state of a return request.
 * Mirrors the visual style of OrderStatusBadge.
 */
export function ReturnStatusBadge({ status }: ReturnStatusBadgeProps) {
  const { label, containerClass, textClass, dotClass } = STATUS_META[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold",
        containerClass,
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full shrink-0", dotClass].join(" ")} aria-hidden="true" />
      <span className={textClass}>{label}</span>
    </span>
  );
}
