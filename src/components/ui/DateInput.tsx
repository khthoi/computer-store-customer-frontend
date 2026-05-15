"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// ─── Public types ──────────────────────────────────────────────────────────────

export type DateInputSize = "sm" | "md" | "lg";

export interface DateInputProps {
  /** Controlled value — ISO date string "YYYY-MM-DD" */
  value?: string;
  /** Called with "YYYY-MM-DD" on day selection */
  onChange?: (value: string) => void;
  /** Visible label rendered above the trigger */
  label?: string;
  /** Hint shown below; hidden when errorMessage is set */
  helperText?: string;
  /** Validation error — red border + message */
  errorMessage?: string;
  /** Placeholder shown when no date is selected */
  placeholder?: string;
  /** @default "md" */
  size?: DateInputSize;
  disabled?: boolean;
  id?: string;
  className?: string;
}

// ─── Internal types ────────────────────────────────────────────────────────────

/** Which level the calendar grid is showing */
type CalendarView = "day" | "month" | "year";

// ─── Style maps (trigger) ─────────────────────────────────────────────────────

const TRIGGER_SIZE: Record<DateInputSize, string> = {
  sm: "h-8  px-3 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

const TRIGGER_BASE =
  "w-full flex items-center justify-between gap-2 rounded border bg-white " +
  "text-left cursor-pointer transition-colors duration-150 " +
  "focus:outline-none focus:ring-2 " +
  "disabled:cursor-not-allowed disabled:bg-secondary-100 disabled:text-secondary-400";

const TRIGGER_NORMAL =
  "border-secondary-300 hover:border-secondary-400 " +
  "focus:border-primary-500 focus:ring-primary-500/15";
const TRIGGER_ERROR  = "border-error-400 focus:border-error-500 focus:ring-error-500/15";
const TRIGGER_OPEN   = "border-primary-500 ring-2 ring-primary-500/15";

// ─── Locale constants ─────────────────────────────────────────────────────────

const DAYS_VI = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const MONTHS_FULL_VI = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

/** Short labels used inside the month-selection grid (3 columns) */
const MONTHS_SHORT_VI = [
  "Th. 1", "Th. 2", "Th. 3", "Th. 4",
  "Th. 5", "Th. 6", "Th. 7", "Th. 8",
  "Th. 9", "Th. 10", "Th. 11", "Th. 12",
];

const YEARS_PER_PAGE = 12; // 3 cols × 4 rows

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Parse "YYYY-MM-DD" → { year, month (0-based), day } | null */
function parseISO(iso: string): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

/** Produce an ISO "YYYY-MM-DD" string */
function toISO(year: number, month: number, day: number): string {
  return [
    String(year),
    String(month + 1).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

/** Display label shown inside the trigger button (DD/MM/YYYY) */
function formatDisplay(iso: string): string {
  const p = parseISO(iso);
  if (!p) return "";
  return `${String(p.day).padStart(2, "0")}/${String(p.month + 1).padStart(2, "0")}/${p.year}`;
}

/**
 * Returns an array of cells for a Monday-start week grid.
 * `null` entries are leading/trailing padding cells.
 */
function buildDayGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sun
  const offset = (firstDow + 6) % 7; // shift to Mon = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array<null>(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Shared cell class builder ────────────────────────────────────────────────

function cellCls(selected: boolean, isToday: boolean, rounded: "full" | "lg"): string {
  const base = `flex items-center justify-center text-sm font-medium transition-colors duration-100
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-${rounded}`;
  if (selected)  return `${base} bg-primary-600 text-white`;
  if (isToday)   return `${base} bg-primary-50 text-primary-700 font-semibold`;
  return         `${base} text-secondary-700 hover:bg-secondary-100`;
}

// ─── Calendar sub-component ───────────────────────────────────────────────────

interface CalendarProps {
  selected: string; // "YYYY-MM-DD" or ""
  onSelect: (iso: string) => void;
}

/**
 * Three-level drill-down calendar:
 *
 *   Day view   — click header → Month view
 *   Month view — click header → Year view  |  click month → Day view
 *   Year view  — click year   → Month view
 *
 * Selecting a day closes the picker.
 * "Hôm nay" always selects today and closes.
 */
function Calendar({ selected, onSelect }: CalendarProps) {
  const today   = new Date();
  const parsed  = parseISO(selected);

  const initYear  = parsed?.year  ?? today.getFullYear();
  const initMonth = parsed?.month ?? today.getMonth();

  const [view,          setView]          = useState<CalendarView>("day");
  const [viewYear,      setViewYear]      = useState(initYear);
  const [viewMonth,     setViewMonth]     = useState(initMonth);
  const [yearPageStart, setYearPageStart] = useState(
    Math.floor(initYear / YEARS_PER_PAGE) * YEARS_PER_PAGE
  );

  // ── Navigation helpers ───────────────────────────────────────────────────

  const prevDay = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextDay = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const prevMonth = () => setViewYear((y) => y - 1);
  const nextMonth = () => setViewYear((y) => y + 1);
  const prevYear  = () => setYearPageStart((s) => s - YEARS_PER_PAGE);
  const nextYear  = () => setYearPageStart((s) => s + YEARS_PER_PAGE);

  // Drill down: click header to go one level deeper
  const handleHeaderClick = () => {
    if (view === "day") {
      setYearPageStart(Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE);
      setView("month");
    } else if (view === "month") {
      setYearPageStart(Math.floor(viewYear / YEARS_PER_PAGE) * YEARS_PER_PAGE);
      setView("year");
    }
    // Year view header is static — no action
  };

  // Drill up: clicking a cell goes to the level above
  const handleYearSelect  = (year: number) => {
    setViewYear(year);
    setYearPageStart(Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE);
    setView("month");
  };
  const handleMonthSelect = (month: number) => {
    setViewMonth(month);
    setView("day");
  };
  const handleDaySelect   = (day: number) => onSelect(toISO(viewYear, viewMonth, day));
  const handleToday       = () =>
    onSelect(toISO(today.getFullYear(), today.getMonth(), today.getDate()));

  // ── Derived values ────────────────────────────────────────────────────────

  const dayCells  = buildDayGrid(viewYear, viewMonth);
  const yearCells = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart + i);

  // ── Header config by view ──────────────────────────────────────────────────

  const HEADER: Record<CalendarView, {
    label: string;
    clickable: boolean;
    prev: () => void;
    next: () => void;
    prevLabel: string;
    nextLabel: string;
  }> = {
    day: {
      label:      `${MONTHS_FULL_VI[viewMonth]} ${viewYear}`,
      clickable:  true,
      prev:       prevDay,
      next:       nextDay,
      prevLabel:  "Tháng trước",
      nextLabel:  "Tháng sau",
    },
    month: {
      label:      String(viewYear),
      clickable:  true,
      prev:       prevMonth,
      next:       nextMonth,
      prevLabel:  "Năm trước",
      nextLabel:  "Năm sau",
    },
    year: {
      label:      `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`,
      clickable:  false,
      prev:       prevYear,
      next:       nextYear,
      prevLabel:  "Trang trước",
      nextLabel:  "Trang sau",
    },
  };

  const hdr = HEADER[view];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-72 select-none">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {/* Prev button */}
        <button
          type="button"
          onClick={hdr.prev}
          aria-label={hdr.prevLabel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-secondary-500
            hover:bg-secondary-100 hover:text-secondary-900
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            transition-colors"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Centre label — clickable in day/month view */}
        {hdr.clickable ? (
          <button
            type="button"
            onClick={handleHeaderClick}
            className="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold
              text-secondary-900 hover:bg-secondary-100 hover:text-primary-600
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
              transition-colors"
            title={view === "day" ? "Chọn tháng / năm" : "Chọn năm"}
          >
            {hdr.label}
            <ChevronDownIcon className="h-3.5 w-3.5 text-secondary-400" aria-hidden />
          </button>
        ) : (
          <span className="px-2 py-1 text-sm font-semibold text-secondary-500">
            {hdr.label}
          </span>
        )}

        {/* Next button */}
        <button
          type="button"
          onClick={hdr.next}
          aria-label={hdr.nextLabel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-secondary-500
            hover:bg-secondary-100 hover:text-secondary-900
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            transition-colors"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* ── Day view ───────────────────────────────────────────────────── */}
      {view === "day" && (
        <div className="px-3 pb-1">
          {/* Weekday header row */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAYS_VI.map((d) => (
              <span
                key={d}
                className="pb-1 text-[10px] font-semibold uppercase tracking-wide text-secondary-400"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {dayCells.map((day, idx) => {
              if (day === null) return <span key={`p${idx}`} />;
              const isSel = parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
              const isTod = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  aria-label={`${day} ${MONTHS_FULL_VI[viewMonth]} ${viewYear}`}
                  aria-pressed={isSel}
                  className={`mx-auto h-8 w-8 ${cellCls(isSel, isTod, "full")}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Month view ─────────────────────────────────────────────────── */}
      {view === "month" && (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1">
          {MONTHS_SHORT_VI.map((name, idx) => {
            const isSel = parsed?.year === viewYear && parsed?.month === idx;
            const isTod = today.getFullYear() === viewYear && today.getMonth() === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleMonthSelect(idx)}
                aria-label={MONTHS_FULL_VI[idx]}
                aria-pressed={isSel}
                className={`h-10 ${cellCls(isSel, isTod, "lg")}`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Year view ──────────────────────────────────────────────────── */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-1.5 px-3 pb-1">
          {yearCells.map((year) => {
            const isSel = parsed?.year === year;
            const isTod = today.getFullYear() === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => handleYearSelect(year)}
                aria-pressed={isSel}
                className={`h-10 tabular-nums ${cellCls(isSel, isTod, "lg")}`}
              >
                {year}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Footer: Today shortcut ─────────────────────────────────────── */}
      <div className="mt-2 border-t border-secondary-100 px-3 py-2 text-center">
        <button
          type="button"
          onClick={handleToday}
          className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
        >
          Hôm nay
        </button>
      </div>
    </div>
  );
}

// ─── DateInput component ──────────────────────────────────────────────────────

/**
 * DateInput — calendar date picker with a portal-rendered dropdown.
 *
 * Calendar UX (three-level drill-down):
 *   1. Opens in **day view** — navigate months with ← →.
 *   2. Click the "Month Year ▾" header → **month view** (12-month grid).
 *   3. Click the "Year ▾" header        → **year view**  (12-year paged grid).
 *   4. Click a year → back to month view with that year pre-selected.
 *   5. Click a month → back to day view.
 *   6. Click a day → fires onChange and closes.
 *   "Hôm nay" selects today's date from any view and closes immediately.
 *
 * Portal strategy (same as `Select`):
 *   - `createPortal` → `document.body` escapes all overflow/z-index stacking.
 *   - `getBoundingClientRect` + scroll/resize listeners keep the panel aligned.
 *   - Flips above the trigger when there is insufficient space below.
 *
 * ```tsx
 * const [dob, setDob] = useState("1995-06-15");
 *
 * <DateInput
 *   label="Ngày sinh"
 *   value={dob}
 *   onChange={setDob}
 *   errorMessage={error}
 * />
 * ```
 */
export function DateInput({
  value = "",
  onChange,
  label,
  helperText,
  errorMessage,
  placeholder = "DD/MM/YYYY",
  size = "md",
  disabled = false,
  id: idProp,
  className = "",
}: DateInputProps) {
  const generatedId = useId();
  const id       = idProp ?? generatedId;
  const errorId  = `${id}-error`;
  const helperId = `${id}-helper`;
  const hasError = Boolean(errorMessage);

  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number; left: number; width: number; flipUp: boolean;
  } | null>(null);

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Position: mirrors Select exactly ──────────────────────────────────────

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect        = triggerRef.current.getBoundingClientRect();
    const PANEL_H     = 330; // approximate max panel height
    const spaceBelow  = window.innerHeight - rect.bottom;
    const flipUp      = spaceBelow < PANEL_H && rect.top > spaceBelow;
    setDropdownPos({
      top:    flipUp ? rect.top : rect.bottom + 4,
      left:   rect.left,
      width:  rect.width,
      flipUp,
    });
  }, []);

  useEffect(() => {
    if (!open) { setDropdownPos(null); return; }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // ── Outside click: check both trigger ref and portal ref ──────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Keyboard on trigger ───────────────────────────────────────────────────

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (["Enter", " ", "ArrowDown"].includes(e.key)) { e.preventDefault(); setOpen(true); }
    if (e.key === "Escape") setOpen(false);
  };

  // ── Selection callback from Calendar ─────────────────────────────────────

  const handleSelect = (iso: string) => {
    onChange?.(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const describedBy =
    [hasError ? errorId : null, !hasError && helperText ? helperId : null]
      .filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 inline-block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        className={[
          TRIGGER_BASE,
          TRIGGER_SIZE[size],
          hasError ? TRIGGER_ERROR : open ? TRIGGER_OPEN : TRIGGER_NORMAL,
          className,
        ].filter(Boolean).join(" ")}
      >
        <span className={value ? "text-secondary-900" : "text-secondary-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <CalendarDaysIcon
          className={[
            "h-4 w-4 shrink-0 transition-colors duration-150",
            open ? "text-primary-600" : "text-secondary-400",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {/* Validation messages */}
      {hasError && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-error-600">
          {errorMessage}
        </p>
      )}
      {!hasError && helperText && (
        <p id={helperId} className="mt-1 text-xs text-secondary-500">
          {helperText}
        </p>
      )}

      {/* Calendar — portal-rendered to document.body */}
      {open && dropdownPos && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            role="dialog"
            aria-modal="false"
            aria-label="Chọn ngày"
            className="fixed z-[9999] rounded-xl border border-secondary-200 bg-white shadow-xl"
            style={{
              top:    dropdownPos.flipUp ? undefined : `${dropdownPos.top}px`,
              bottom: dropdownPos.flipUp ? `${window.innerHeight - dropdownPos.top + 4}px` : undefined,
              left:   `${dropdownPos.left}px`,
              minWidth: "288px",
            }}
          >
            <Calendar selected={value} onSelect={handleSelect} />
          </div>,
          document.body
        )}
    </div>
  );
}

/*
 * ─── DateInput Prop Table ──────────────────────────────────────────────────────
 *
 * Name          Type                    Default       Description
 * ──────────────────────────────────────────────────────────────────────────────
 * value         string                  ""            Controlled ISO date "YYYY-MM-DD"
 * onChange      (v: string) => void     —             Called on day selection
 * label         string                  —             Label above trigger
 * helperText    string                  —             Hint below; hidden on error
 * errorMessage  string                  —             Validation error message
 * placeholder   string                  "DD/MM/YYYY"  Trigger placeholder
 * size          "sm"|"md"|"lg"          "md"          Trigger height
 * disabled      boolean                 false         Disable the control
 * id            string                  auto          HTML id for label linkage
 * className     string                  ""            Extra classes on trigger button
 *
 * ─── Calendar UX ──────────────────────────────────────────────────────────────
 *
 * View      Header action     Cell action
 * ──────────────────────────────────────────────────────────────────────────────
 * day       click → month     click day    → fires onChange + close
 * month     click → year      click month  → back to day view
 * year      (static)          click year   → back to month view
 *
 * "Hôm nay" button selects today's date from any view and closes.
 * ← → arrows navigate months / years / year-pages depending on the active view.
 */
