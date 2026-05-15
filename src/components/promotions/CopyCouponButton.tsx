"use client";

import { useState } from "react";
import { ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

export interface CopyCouponButtonProps {
  code: string;
  className?: string;
}

export function CopyCouponButton({ code, className }: CopyCouponButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Sao chép mã ${code}`}
      className={[
        "inline-flex items-center gap-1.5 rounded-lg border border-primary-200",
        "bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700",
        "transition-colors hover:bg-primary-100",
        className ?? "",
      ].join(" ")}
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" aria-hidden="true" />
          Đã sao chép
        </>
      ) : (
        <>
          <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
          Sao chép mã
        </>
      )}
    </button>
  );
}
