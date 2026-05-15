"use client";

import { useEffect, useState } from "react";

const LS_KEY = "compare_list";

interface PersistedCompare {
  compareList?: Array<{ id?: string }>;
}

function readCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as PersistedCompare;
    return Array.isArray(parsed.compareList) ? parsed.compareList.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Reads the compare-list count from localStorage so the Header can show a
 * badge without needing CompareProvider at the root. Listens to both the
 * native `storage` event (cross-tab) and a custom `compare-changed` event
 * (same-tab dispatch — emitted manually whenever the compare list mutates).
 */
export function useCompareCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readCount());

    function handleStorage(event: StorageEvent) {
      if (event.key === LS_KEY || event.key === null) {
        setCount(readCount());
      }
    }
    function handleLocal() {
      setCount(readCount());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("compare-changed", handleLocal);

    const intervalId = window.setInterval(() => setCount(readCount()), 2000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("compare-changed", handleLocal);
      window.clearInterval(intervalId);
    };
  }, []);

  return count;
}
