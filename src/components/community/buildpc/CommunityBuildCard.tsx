"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EyeIcon,
  Square2StackIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import type {
  CommunityBuildSummary,
  CommunityBuildThumbnail,
} from "@/src/services/community-buildpc.service";

interface CommunityBuildCardProps {
  build: CommunityBuildSummary;
  onView: (build: CommunityBuildSummary) => void;
  onClone: (build: CommunityBuildSummary) => void;
  cloning?: boolean;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

/** Pixels scrolled per arrow click — roughly one thumbnail + gap. */
const SLIDER_STEP_PX = 124;
/** Min pointer movement (px) to consider it a drag rather than a click. */
const DRAG_THRESHOLD_PX = 4;

function ThumbnailSlider({ items }: { items: CommunityBuildThumbnail[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Drag-to-scroll state held in a ref to avoid re-renders during pointer move
  const dragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
  });

  const updateArrowState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrowState();
    const observer = new ResizeObserver(updateArrowState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items, updateArrowState]);

  const scrollByDelta = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore right-click / middle-click
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (state.pointerId !== e.pointerId) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - state.startX;
    if (!state.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX) return;
      state.moved = true;
      // Acquire pointer capture only after the user actually starts dragging
      // so accidental taps don't interfere with hover-driven Tooltip behavior.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {}
    }
    el.scrollLeft = state.startScrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (state.pointerId !== e.pointerId) return;
    const el = scrollRef.current;
    if (el && el.hasPointerCapture?.(e.pointerId)) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {}
    }
    dragRef.current.pointerId = null;
  };

  if (items.length === 0) {
    return (
      <div className="flex h-14 w-full items-center justify-center rounded-lg border border-secondary-100 bg-secondary-50">
        <CubeIcon className="h-6 w-6 text-secondary-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="group/slider relative">
      <div
        ref={scrollRef}
        role="list"
        aria-label="Linh kiện chính của cấu hình"
        onScroll={updateArrowState}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className="flex gap-1.5 overflow-x-auto select-none cursor-grab active:cursor-grabbing touch-pan-x [-webkit-user-select:none] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((t, idx) => {
          const label = t.slotName
            ? `${t.slotName}: ${t.productName || t.variantName || "Linh kiện"}`
            : t.productName || t.variantName || `Linh kiện ${idx + 1}`;
          const href = t.productSlug
            ? `/products/${encodeURIComponent(t.productSlug)}?variant=${t.variantId}`
            : null;
          return (
            <Tooltip
              key={`${t.url}-${idx}`}
              content={
                <div className="space-y-0.5">
                  <p className="font-semibold leading-snug">
                    {t.productName || t.variantName || "Linh kiện"}
                  </p>
                  {t.variantName && t.productName && (
                    <p className="text-[11px] text-secondary-300">{t.variantName}</p>
                  )}
                  {t.slotName && (
                    <p className="text-[11px] text-secondary-300">
                      Khe: {t.slotName}
                    </p>
                  )}
                </div>
              }
              placement="top"
            >
              <a
                role="listitem"
                href={href ?? "#"}
                target={href ? "_blank" : undefined}
                rel={href ? "noopener noreferrer" : undefined}
                aria-label={label}
                onClick={(e) => {
                  // Cancel the click if the user just finished a drag,
                  // or if the thumbnail has no linkable product.
                  if (dragRef.current.moved || !href) {
                    e.preventDefault();
                  }
                }}
                className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-secondary-100 bg-secondary-50 transition-colors hover:border-primary-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-300"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.url}
                  alt={label}
                  draggable={false}
                  className="h-full w-full select-none object-cover [-webkit-user-drag:none]"
                />
              </a>
            </Tooltip>
          );
        })}
      </div>

      {/* Prev / Next overlay buttons — only rendered when scrolling is possible */}
      {canPrev && (
        <button
          type="button"
          aria-label="Linh kiện trước"
          onClick={() => scrollByDelta(-SLIDER_STEP_PX)}
          className="absolute left-0 top-1/2 z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 shadow-sm transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-300"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Linh kiện tiếp theo"
          onClick={() => scrollByDelta(SLIDER_STEP_PX)}
          className="absolute right-0 top-1/2 z-10 flex h-7 w-7 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 shadow-sm transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-300"
        >
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function CommunityBuildCard({
  build,
  onView,
  onClone,
  cloning = false,
}: CommunityBuildCardProps) {
  const updatedAt = new Date(build.ngayCapNhat).toLocaleDateString("vi-VN");

  return (
    <div className="flex h-full flex-col rounded-xl border border-secondary-200 bg-white p-4 transition-colors duration-150 hover:border-secondary-300 hover:shadow-sm">
      {/* ── Thumbnail slider ── */}
      <div className="mb-3">
        <ThumbnailSlider items={build.thumbnails} />
      </div>

      {/* ── Build name (1 line truncate, fixed height) ── */}
      <Tooltip content={build.tenBuild} placement="top">
        <h3 className="truncate text-sm font-semibold text-secondary-800 leading-5">
          {build.tenBuild}
        </h3>
      </Tooltip>

      {/* ── Description — always reserve 1 line for alignment across cards ── */}
      <p className="mt-0.5 min-h-[1rem] truncate text-xs leading-4 text-secondary-500">
        {build.moTa || " "}
      </p>

      {/* ── Author + date (fixed) ── */}
      <div className="mt-3 flex h-6 items-center gap-2 text-xs text-secondary-500">
        <Avatar
          src={build.authorAvatar ?? undefined}
          name={build.authorName ?? "Ẩn danh"}
          size="xs"
        />
        <span className="min-w-0 truncate">
          {build.authorName ?? "Người dùng ẩn danh"}
        </span>
        <span className="text-secondary-300">·</span>
        <span className="shrink-0">{updatedAt}</span>
      </div>

      {/* ── Divider — pushed to start of bottom block via mt-auto ── */}
      <div className="my-3 mt-auto border-t border-secondary-100" />

      {/* ── Price ── */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-secondary-500">
          Giá ước tính
        </p>
        <p className="text-base font-bold text-secondary-900">
          {formatVND(build.tongGia)}
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-500">
        <span className="inline-flex items-center gap-1">
          <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {formatCompact(build.views)} xem
        </span>
        <span className="inline-flex items-center gap-1">
          <Square2StackIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {formatCompact(build.clones)} clone
        </span>
        <span className="inline-flex items-center gap-1">
          <CubeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {build.itemCount} linh kiện
        </span>
      </div>

      {/* ── Actions ── */}
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onView(build)}
          className="flex-1"
        >
          Xem chi tiết
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onClone(build)}
          isLoading={cloning}
          disabled={cloning}
          className="flex-1"
        >
          Clone
        </Button>
      </div>
    </div>
  );
}
