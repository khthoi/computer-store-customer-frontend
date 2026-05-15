"use client";

import { useEffect, useState } from "react";
import { BoltIcon } from "@heroicons/react/24/solid";

interface FlashSaleCountdownProps {
  endAt: string;
}

function formatRemaining(ms: number): { h: string; m: string; s: string } {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return { h: pad(h), m: pad(m), s: pad(s) };
}

export function FlashSaleCountdown({ endAt }: FlashSaleCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setMounted(true);
    const tick = () => setRemaining(new Date(endAt).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endAt]);

  // Avoid hydration mismatch: server renders without Date.now()
  if (!mounted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-error-700">
        <BoltIcon className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <span className="text-secondary-700">Kết thúc sau:</span>
      </span>
    );
  }

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary-500">
        <BoltIcon className="h-4 w-4 text-orange-500" aria-hidden="true" />
        Đã kết thúc
      </span>
    );
  }

  const { h, m, s } = formatRemaining(remaining);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-error-700">
      <BoltIcon className="h-4 w-4 text-orange-500" aria-hidden="true" />
      <span className="text-secondary-700">Kết thúc sau:</span>
      <span className="bg-error-500 text-white rounded px-1.5 py-0.5 tabular-nums">{h}</span>
      <span className="text-error-700">:</span>
      <span className="bg-error-500 text-white rounded px-1.5 py-0.5 tabular-nums">{m}</span>
      <span className="text-error-700">:</span>
      <span className="bg-error-500 text-white rounded px-1.5 py-0.5 tabular-nums">{s}</span>
    </span>
  );
}
