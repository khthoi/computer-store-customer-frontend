import type { ComponentType } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import type { OrderStatus } from "@/src/types/account-order.types";

export interface StatusMeta {
  label: string;
  containerClass: string;
  textClass: string;
  iconClass: string;
  ringClass: string;
  completedLineClass: string;
  completedCircleClass: string;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export function getStatusMeta(status: OrderStatus): StatusMeta {
  switch (status) {
    case "pending":
      return {
        label: "Chờ xác nhận",
        containerClass: "bg-warning-50 border border-warning-200",
        textClass: "text-warning-700",
        iconClass: "text-warning-600",
        ringClass: "bg-warning-400",
        completedLineClass: "bg-warning-300",
        completedCircleClass: "bg-warning-500",
        Icon: ClockIcon,
      };
    case "confirmed":
      return {
        label: "Đã xác nhận",
        containerClass: "bg-info-50 border border-info-200",
        textClass: "text-info-700",
        iconClass: "text-info-600",
        ringClass: "bg-info-400",
        completedLineClass: "bg-info-300",
        completedCircleClass: "bg-info-500",
        Icon: CheckCircleIcon,
      };
    case "preparing":
      return {
        label: "Đang chuẩn bị",
        containerClass: "bg-secondary-100 border border-secondary-200",
        textClass: "text-secondary-700",
        iconClass: "text-secondary-500",
        ringClass: "bg-secondary-400",
        completedLineClass: "bg-secondary-300",
        completedCircleClass: "bg-secondary-500",
        Icon: ArchiveBoxIcon,
      };
    case "shipping":
      return {
        label: "Đang giao hàng",
        containerClass: "bg-primary-50 border border-primary-200",
        textClass: "text-primary-700",
        iconClass: "text-primary-600",
        ringClass: "bg-primary-400",
        completedLineClass: "bg-primary-300",
        completedCircleClass: "bg-primary-500",
        Icon: TruckIcon,
      };
    case "delivered":
      return {
        label: "Đã giao hàng",
        containerClass: "bg-success-50 border border-success-200",
        textClass: "text-success-700",
        iconClass: "text-success-600",
        ringClass: "bg-success-400",
        completedLineClass: "bg-success-300",
        completedCircleClass: "bg-success-500",
        Icon: CheckBadgeIcon,
      };
    case "cancelled":
      return {
        label: "Đã hủy",
        containerClass: "bg-error-50 border border-error-200",
        textClass: "text-error-700",
        iconClass: "text-error-600",
        ringClass: "bg-error-400",
        completedLineClass: "bg-error-300",
        completedCircleClass: "bg-error-500",
        Icon: XCircleIcon,
      };
  }
}
