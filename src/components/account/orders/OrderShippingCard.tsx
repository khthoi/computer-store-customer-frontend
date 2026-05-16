"use client";

import { useState } from "react";
import {
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  TruckIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import type { ShippingInfo } from "@/src/types/account-order.types";

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-secondary-700">
      <span className="mt-0.5 shrink-0 text-secondary-400">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface OrderShippingCardProps {
  shipping: ShippingInfo;
  className?: string;
}

/**
 * OrderShippingCard — displays recipient info + carrier tracking details.
 *
 * - Clicking the copy icon copies the tracking code to clipboard.
 * - Icon swaps to CheckIcon for 2s to confirm the copy.
 * - External tracking URL opens in a new tab.
 */
export function OrderShippingCard({ shipping, className }: OrderShippingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shipping.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silent fail
    }
  };

  return (
    <div className={["rounded-2xl border border-secondary-200 bg-white p-5 space-y-5", className].filter(Boolean).join(" ")}>
      {/* ── Recipient ──────────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-400">
          Địa chỉ nhận hàng
        </p>
        <div className="space-y-2">
          <InfoRow icon={<UserIcon className="h-4 w-4" />}>
            <span className="font-medium text-secondary-900">
              {shipping.recipientName}
            </span>
          </InfoRow>
          <InfoRow icon={<PhoneIcon className="h-4 w-4" />}>
            {shipping.phone}
          </InfoRow>
          <InfoRow icon={<MapPinIcon className="h-4 w-4" />}>
            {shipping.address}
          </InfoRow>
        </div>
      </div>

      <hr className="border-secondary-100" />

      {/* ── Carrier / Tracking ─────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary-400">
          Thông tin vận chuyển
        </p>
        <div className="space-y-2">
          <InfoRow icon={<TruckIcon className="h-4 w-4" />}>
            {shipping.carrierName}
          </InfoRow>

          {/* Tracking code row with copy button */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary-500 shrink-0">
              Mã vận đơn:
            </span>
            <span className="font-mono text-sm font-medium text-secondary-900">
              {shipping.trackingCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Đã sao chép" : "Sao chép mã vận đơn"}
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-success-600" aria-hidden />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>

          {/* External tracking link */}
          {shipping.trackingUrl && (
            <a
              href={shipping.trackingUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
            >
              Theo dõi đơn hàng
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
