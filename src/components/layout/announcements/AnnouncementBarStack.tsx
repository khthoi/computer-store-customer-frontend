"use client";

import type {
  BarPosition,
  StorefrontAnnouncementBar,
} from "@/src/types/announcement.types";
import { AnnouncementBar } from "./AnnouncementBar";

interface Props {
  bars: StorefrontAnnouncementBar[];
  position: BarPosition;
}

export function AnnouncementBarStack({ bars, position }: Props) {
  const filtered = bars.filter((bar) => bar.position === position);
  if (filtered.length === 0) return null;

  return (
    <div className={position === "bottom" ? "mt-0" : ""}>
      {filtered.map((bar) => (
        <AnnouncementBar key={bar.id} bar={bar} />
      ))}
    </div>
  );
}
