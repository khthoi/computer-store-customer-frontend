"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontPopup } from "@/src/types/announcement.types";
import { Popup } from "./Popup";

interface Props {
  popups: StorefrontPopup[];
}

const DISMISS_KEY_PREFIX = "popup_dismissed_";

function matchPath(pattern: string, pathname: string): boolean {
  if (!pattern || pattern === "*") return true;
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(pathname);
}

function matchesTargetPages(targetPages: string[], pathname: string): boolean {
  if (!targetPages || targetPages.length === 0) return true;
  return targetPages.some((p) => matchPath(p, pathname));
}

function isDismissed(id: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`${DISMISS_KEY_PREFIX}${id}`) === "1";
}

export function PopupHost({ popups }: Props) {
  const pathname = usePathname() ?? "/";
  const [hydrated, setHydrated] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHydrated(true);
    const initial = new Set<string>();
    for (const popup of popups) {
      if (popup.showOnce && isDismissed(popup.id)) initial.add(popup.id);
    }
    setDismissedIds(initial);
  }, [popups]);

  const active = useMemo(() => {
    if (!hydrated) return null;
    return (
      popups.find(
        (p) =>
          !dismissedIds.has(p.id) && matchesTargetPages(p.targetPages, pathname),
      ) ?? null
    );
  }, [hydrated, popups, dismissedIds, pathname]);

  if (!active) return null;

  return (
    <Popup
      key={active.id}
      popup={active}
      onDismissed={(id) =>
        setDismissedIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        })
      }
    />
  );
}
