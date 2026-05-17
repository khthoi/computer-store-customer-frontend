"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { StorefrontPopup } from "@/src/types/announcement.types";
import { Popup } from "./Popup";

interface Props {
  popups: StorefrontPopup[];
}

/** sessionStorage flag — once-per-tab guard for `showOnce` popups. */
const SESSION_FLAG_PREFIX = "popup_dismissed_";
/** localStorage timestamp — cross-tab cooldown after a dismissal. */
const COOLDOWN_KEY_PREFIX = "popup_cooldown_at_";

/**
 * Cooldown duration after the user dismisses a popup.
 *
 * - `showOnce` popups: 30 days. The intent is "once per session" — pairing this
 *   long cooldown with the sessionStorage flag prevents opening multiple tabs
 *   from re-triggering the same popup on every fresh tab.
 * - Regular popups: 24 hours. Long enough to avoid annoyance, short enough that
 *   an admin-updated popup is seen again the next day.
 */
const COOLDOWN_SHOW_ONCE_MS = 30 * 24 * 60 * 60 * 1000;
const COOLDOWN_DEFAULT_MS = 24 * 60 * 60 * 1000;

/** Path prefixes where popups must not appear. */
const SUPPRESSED_PATH_PREFIXES = ["/account"];

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

function isPathSuppressed(pathname: string): boolean {
  return SUPPRESSED_PATH_PREFIXES.some((p) => pathname.startsWith(p));
}

function isDismissedNow(popup: StorefrontPopup): boolean {
  if (typeof window === "undefined") return false;

  if (popup.showOnce) {
    const sessionFlag = window.sessionStorage.getItem(
      `${SESSION_FLAG_PREFIX}${popup.id}`,
    );
    if (sessionFlag === "1") return true;
  }

  const raw = window.localStorage.getItem(`${COOLDOWN_KEY_PREFIX}${popup.id}`);
  if (!raw) return false;
  const ts = Number(raw);
  if (!Number.isFinite(ts)) return false;
  const cooldown = popup.showOnce ? COOLDOWN_SHOW_ONCE_MS : COOLDOWN_DEFAULT_MS;
  return Date.now() - ts < cooldown;
}

export function PopupHost({ popups }: Props) {
  const pathname = usePathname() ?? "/";
  const [hydrated, setHydrated] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setHydrated(true);
    const initial = new Set<string>();
    for (const popup of popups) {
      if (isDismissedNow(popup)) initial.add(popup.id);
    }
    setDismissedIds(initial);
  }, [popups]);

  const active = useMemo(() => {
    if (!hydrated) return null;
    if (isPathSuppressed(pathname)) return null;
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
