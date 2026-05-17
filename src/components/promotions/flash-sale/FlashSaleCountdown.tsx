"use client";

import { useEffect, useState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(endsAt: string): TimeLeft {
  const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * FlashSaleCountdown — live HH:MM:SS countdown.
 *
 * Wrapped in a `mounted` guard to prevent hydration mismatch:
 * the server cannot know `Date.now()` at client render time.
 * The component renders nothing on the server and activates
 * on the first client effect.
 */
export function FlashSaleCountdown({ endsAt }: { endsAt: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(getTimeLeft(endsAt));

    const id = setInterval(() => {
      const tl = getTimeLeft(endsAt);
      setTimeLeft(tl);
      if (tl.hours === 0 && tl.minutes === 0 && tl.seconds === 0) {
        clearInterval(id);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [endsAt]);

  if (!mounted) return null;

  const isOver =
    timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isOver) {
    return (
      <span className="text-sm font-semibold text-secondary-400">
        Đã kết thúc
      </span>
    );
  }

  const units = [timeLeft.hours, timeLeft.minutes, timeLeft.seconds];

  return (
    <div
      aria-label={`Còn ${timeLeft.hours} giờ ${timeLeft.minutes} phút ${timeLeft.seconds} giây`}
      className="flex items-center gap-1"
    >
      {units.map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className="inline-flex h-8 w-9 items-center justify-center rounded-md bg-secondary-900 font-mono text-sm font-bold text-white tabular-nums">
            {pad(unit)}
          </span>
          {i < 2 && (
            <span className="text-sm font-bold text-secondary-500" aria-hidden="true">
              :
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
