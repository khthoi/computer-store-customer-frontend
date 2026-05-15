import { storefrontApiFetch } from "@/src/services/storefront-api.service";
import type {
  BarPosition,
  PopupPosition,
  PopupTrigger,
  StorefrontAnnouncementBar,
  StorefrontPopup,
} from "@/src/types/announcement.types";

interface RawPopup {
  id: string | number;
  name: string;
  position: string;
  trigger: string;
  delaySeconds: number | null;
  scrollPercent: number | null;
  title: string | null;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  showCloseButton: boolean;
  showOnce: boolean;
  targetPages: string[] | null;
  startDate: string | null;
  endDate: string | null;
}

interface RawAnnouncementBar {
  id: string | number;
  name: string;
  position: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  showCloseButton: boolean;
  isScrolling: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
}

const POPUP_POSITIONS: readonly PopupPosition[] = [
  "center",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
];

const POPUP_TRIGGERS: readonly PopupTrigger[] = [
  "on_load",
  "on_exit",
  "on_scroll",
  "on_delay",
];

function toPopupPosition(value: string): PopupPosition {
  return (POPUP_POSITIONS as readonly string[]).includes(value)
    ? (value as PopupPosition)
    : "center";
}

function toPopupTrigger(value: string): PopupTrigger {
  return (POPUP_TRIGGERS as readonly string[]).includes(value)
    ? (value as PopupTrigger)
    : "on_load";
}

function toBarPosition(value: string): BarPosition {
  return value === "bottom" ? "bottom" : "top";
}

function mapPopup(raw: RawPopup): StorefrontPopup {
  return {
    id: String(raw.id),
    name: raw.name,
    position: toPopupPosition(raw.position),
    trigger: toPopupTrigger(raw.trigger),
    delaySeconds: raw.delaySeconds,
    scrollPercent: raw.scrollPercent,
    title: raw.title,
    body: raw.body,
    imageUrl: raw.imageUrl,
    ctaLabel: raw.ctaLabel,
    ctaUrl: raw.ctaUrl,
    showCloseButton: raw.showCloseButton,
    showOnce: raw.showOnce,
    targetPages: Array.isArray(raw.targetPages) ? raw.targetPages : [],
    startDate: raw.startDate,
    endDate: raw.endDate,
  };
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function safeColor(value: string, fallback: string): string {
  return HEX_COLOR.test(value) ? value : fallback;
}

function mapBar(raw: RawAnnouncementBar): StorefrontAnnouncementBar {
  return {
    id: String(raw.id),
    name: raw.name,
    position: toBarPosition(raw.position),
    content: raw.content,
    backgroundColor: safeColor(raw.backgroundColor, "#0F172A"),
    textColor: safeColor(raw.textColor, "#FFFFFF"),
    showCloseButton: raw.showCloseButton,
    isScrolling: raw.isScrolling,
    linkUrl: raw.linkUrl,
    linkLabel: raw.linkLabel,
  };
}

export async function getActivePopups(): Promise<StorefrontPopup[]> {
  const raw = await storefrontApiFetch<RawPopup[]>("/popups", {
    cache: "no-store",
  });
  return raw.map(mapPopup);
}

export async function getActiveAnnouncementBars(): Promise<StorefrontAnnouncementBar[]> {
  const raw = await storefrontApiFetch<RawAnnouncementBar[]>("/announcement-bars", {
    cache: "no-store",
  });
  return raw.map(mapBar);
}
