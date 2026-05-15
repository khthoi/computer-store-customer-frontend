export type PopupPosition =
  | "center"
  | "top_left"
  | "top_right"
  | "bottom_left"
  | "bottom_right";

export type PopupTrigger = "on_load" | "on_exit" | "on_scroll" | "on_delay";

export interface StorefrontPopup {
  id: string;
  name: string;
  position: PopupPosition;
  trigger: PopupTrigger;
  delaySeconds: number | null;
  scrollPercent: number | null;
  title: string | null;
  body: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  showCloseButton: boolean;
  showOnce: boolean;
  targetPages: string[];
  startDate: string | null;
  endDate: string | null;
}

export type BarPosition = "top" | "bottom";

export interface StorefrontAnnouncementBar {
  id: string;
  name: string;
  position: BarPosition;
  content: string;
  backgroundColor: string;
  textColor: string;
  showCloseButton: boolean;
  isScrolling: boolean;
  linkUrl: string | null;
  linkLabel: string | null;
}
