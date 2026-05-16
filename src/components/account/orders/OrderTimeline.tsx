"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/solid";
import { getStatusMeta } from "@/src/lib/orders/status-meta";
import type {
  OrderStatus,
  TimelineEvent,
} from "@/src/types/account-order.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-component: single step ───────────────────────────────────────────────

interface StepProps {
  event: TimelineEvent;
  isLast: boolean;
  orderStatus: OrderStatus;
  index: number;
}

function TimelineStep({ event, isLast, orderStatus, index }: StepProps) {
  const statusMeta = getStatusMeta(orderStatus);
  const cancelMeta = getStatusMeta("cancelled");

  // Determine which meta to use for visual styling
  const isCancelStep = event.status === "cancelled";
  const activeMeta = isCancelStep ? cancelMeta : statusMeta;

  // Current step = has a timestamp but not yet completed (or is the last completed step)
  const isCurrent =
    event.timestamp !== null &&
    !event.completed &&
    event.status !== "cancelled";

  // A fully completed step (including the current "in progress" step for cancelled)
  const isCompleted = event.completed;

  // Connecting line color
  const lineClass = isCompleted
    ? activeMeta.completedLineClass
    : "bg-secondary-200";

  // Circle classes
  let circleClass: string;
  if (isCurrent) {
    circleClass = `${activeMeta.completedCircleClass} ring-4 ${activeMeta.ringClass}/30`;
  } else if (isCompleted) {
    circleClass = activeMeta.completedCircleClass;
  } else if (isCancelStep) {
    circleClass = "bg-error-500";
  } else {
    circleClass = "bg-secondary-200";
  }

  return (
    <motion.li
      className="relative flex gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
    >
      {/* Vertical connecting line (all steps except last) */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div
          className={[
            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200",
            circleClass,
          ].join(" ")}
        >
          {/* Pulsing ring for current in-progress step */}
          {isCurrent && (
            <motion.span
              className={[
                "absolute inset-0 rounded-full opacity-40",
                activeMeta.completedCircleClass,
              ].join(" ")}
              animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {isCompleted ? (
            <CheckIcon className="h-4 w-4 text-white" aria-hidden />
          ) : isCurrent ? (
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          ) : isCancelStep ? (
            <span className="h-2.5 w-2.5 rounded-full bg-white" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-secondary-400" />
          )}
        </div>

        {/* Connecting line below the circle */}
        {!isLast && (
          <div
            className={["mt-1 w-0.5 flex-1 transition-colors duration-200", lineClass].join(" ")}
          />
        )}
      </div>

      {/* Text content */}
      <div className="pb-6 pt-1 min-w-0">
        <p
          className={[
            "text-sm font-semibold",
            isCompleted || isCurrent
              ? isCancelStep
                ? "text-error-700"
                : "text-secondary-900"
              : "text-secondary-400",
          ].join(" ")}
        >
          {event.label}
        </p>

        {/* Always render — invisible when no timestamp so row height stays uniform,
            keeping the connecting line the same length across all steps. */}
        <p
          className={[
            "mt-0.5 text-xs text-secondary-400",
            event.timestamp ? "" : "invisible",
          ].filter(Boolean).join(" ")}
        >
          {event.timestamp ? formatTimestamp(event.timestamp) : "\u00A0"}
        </p>

        {event.note && (
          <p className="mt-1 text-xs text-secondary-500 italic">{event.note}</p>
        )}
      </div>
    </motion.li>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderTimelineProps {
  events: TimelineEvent[];
  orderStatus: OrderStatus;
  cancelReason?: string;
}

/**
 * OrderTimeline — vertical lifecycle stepper for an order's history.
 *
 * - Stagger-reveal animation on mount (Framer Motion).
 * - Current in-progress step shows a pulsing ring.
 * - Completed steps show a CheckIcon in a colored circle.
 * - Cancelled orders show an extra red step at the end with the cancel reason.
 */
export function OrderTimeline({
  events,
  orderStatus,
  cancelReason,
}: OrderTimelineProps) {
  const cancelMeta = getStatusMeta("cancelled");

  // Build the display events list; append a cancel step if order is cancelled
  const displayEvents: (TimelineEvent & { _isCancelAppended?: boolean })[] = [
    ...events,
  ];

  if (orderStatus === "cancelled") {
    displayEvents.push({
      status: "cancelled",
      label: "Đơn hàng đã bị hủy",
      timestamp: events.find((e) => e.status === "pending")?.timestamp ?? null,
      note: cancelReason,
      completed: true,
      _isCancelAppended: true,
    });
  }

  return (
    <ol className="space-y-0" aria-label="Lịch sử đơn hàng">
      {displayEvents.map((event, index) => {
        const isCancelStep =
          event.status === "cancelled" && event._isCancelAppended;
        const isLast = index === displayEvents.length - 1;

        // For the cancel step, override circle classes directly in the component
        if (isCancelStep) {
          return (
            <motion.li
              key="cancelled-step"
              className="relative flex gap-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.07,
                ease: "easeOut",
              }}
            >
              <div className="flex flex-col items-center">
                <div
                  className={[
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    cancelMeta.completedCircleClass,
                  ].join(" ")}
                >
                  <CheckIcon className="h-4 w-4 text-white" aria-hidden />
                </div>
                {!isLast && (
                  <div className="mt-1 w-0.5 flex-1 bg-secondary-200" />
                )}
              </div>
              <div className="pb-6 pt-1 min-w-0">
                <p className="text-sm font-semibold text-error-700">
                  {event.label}
                </p>
                <p
                  className={[
                    "mt-0.5 text-xs text-secondary-400",
                    event.timestamp ? "" : "invisible",
                  ].filter(Boolean).join(" ")}
                >
                  {event.timestamp ? formatTimestamp(event.timestamp) : "\u00A0"}
                </p>
                {event.note && (
                  <p className="mt-1 text-xs text-secondary-500 italic">
                    Lý do: {event.note}
                  </p>
                )}
              </div>
            </motion.li>
          );
        }

        return (
          <TimelineStep
            key={`${event.status}-${index}`}
            event={event}
            isLast={isLast}
            orderStatus={orderStatus}
            index={index}
          />
        );
      })}
    </ol>
  );
}
