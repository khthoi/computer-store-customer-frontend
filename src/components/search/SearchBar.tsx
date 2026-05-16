"use client";

import { type FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SearchSuggestionsPopover } from "./SearchSuggestionsPopover";
import type { SearchShortcutItem } from "@/src/types/storefront-layout.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchBarSize = "default" | "lg";

export interface SearchBarProps {
  /**
   * Visual size variant.
   * "default" — matches the original Header search box exactly.
   * "lg"      — taller input + labelled submit button for the search results hero.
   * @default "default"
   */
  size?: SearchBarSize;
  /** Pre-fill the input field (used on the search results page). */
  initialValue?: string;
  /**
   * Called on submit in addition to the router push.
   * Lets SearchResultsPageInner navigate without full-page reload.
   */
  onSearch?: (query: string) => void;
  shortcutItems?: SearchShortcutItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function saveSearchHistory(q: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("search_history");
    const existing: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    const deduped = [q, ...existing.filter((x) => x !== q)].slice(0, 8);
    localStorage.setItem("search_history", JSON.stringify(deduped));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SearchBar — extracted from Header.tsx SearchBox; reusable across Header and
 * the /search results page.
 *
 * Renders a full-width search form with:
 * - Inline clear (×) button when the input has content
 * - Autocomplete suggestion popover on focus (SearchSuggestionsPopover)
 * - localStorage history saving on each confirmed search
 * - Navigation to /search?q=... on submit
 *
 * The popover is focus-driven (not click-driven) and uses a container-level
 * onBlur check so clicking items inside the popover does not close it.
 */
export function SearchBar({
  size = "default",
  initialValue = "",
  onSearch,
  shortcutItems = [],
}: SearchBarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // ── Core submit ──────────────────────────────────────────────────────────────

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveSearchHistory(trimmed);
    setIsFocused(false);
    // Blur the input so a subsequent click re-fires onFocus and re-opens the
    // popover. Without this, the DOM focus stays on the input after navigation,
    // and clicking it again produces no `focus` event — the user would be
    // stuck until they manually clear the field.
    inputRef.current?.blur();
    onSearch?.(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    submit(query);
  }

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  // ── Focus management ────────────────────────────────────────────────────────
  // The popover renders through a portal and tracks outside clicks itself,
  // so we no longer rely on a container-level onBlur — it would fire spuriously
  // when the user clicks an item that is no longer inside the container DOM tree.

  // ── Size variants ────────────────────────────────────────────────────────────

  const isLg = size === "lg";

  const inputCls = isLg
    ? "peer w-full rounded-l-xl border border-r-0 border-secondary-300 bg-white py-3.5 pl-5 pr-10 text-base text-secondary-900 placeholder-secondary-400 transition-shadow focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 [&::-webkit-search-cancel-button]:appearance-none"
    : "peer w-full rounded-l-lg border border-r-0 border-secondary-300 bg-white py-2.5 pl-4 pr-8 text-sm text-secondary-900 placeholder-secondary-400 transition-shadow focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200 [&::-webkit-search-cancel-button]:appearance-none";

  const clearCls = isLg
    ? "absolute right-3 text-secondary-400 hover:text-secondary-600 transition-colors"
    : "absolute right-2 text-secondary-400 hover:text-secondary-600 transition-colors";

  const submitCls = isLg
    ? "flex shrink-0 items-center gap-2 rounded-r-xl bg-primary-600 px-5 py-3.5 text-base font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
    : "flex shrink-0 items-center gap-1.5 rounded-r-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1";

  const iconSize = isLg ? "w-5 h-5" : "w-4 h-4";
  const clearIconSize = isLg ? "w-5 h-5" : "w-4 h-4";

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        aria-label="Tìm kiếm sản phẩm"
        onSubmit={handleFormSubmit}
        className="flex w-full"
      >
        <div className="relative flex w-full items-center">
          <label htmlFor="site-search" className="sr-only">
            Tìm kiếm
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            // Safety net: re-open popover even if the input was already focused
            // (e.g. after navigation kept DOM focus but isFocused was reset).
            onClick={() => setIsFocused(true)}
            placeholder="Nhập tên sản phẩm, từ khoá cần tìm..."
            autoComplete="off"
            className={inputCls}
          />
          {query && (
            <button
              type="button"
              aria-label="Xóa tìm kiếm"
              onClick={clearQuery}
              className={clearCls}
            >
              <XMarkIcon className={clearIconSize} aria-hidden="true" />
            </button>
          )}
        </div>

        <button type="submit" aria-label="Tìm kiếm" className={submitCls}>
          <MagnifyingGlassIcon className={iconSize} aria-hidden="true" />
          {isLg && <span>Tìm kiếm</span>}
        </button>
      </form>

      {/* Autocomplete suggestions — absolute, below the form */}
      <SearchSuggestionsPopover
        query={query}
        isFocused={isFocused}
        onSubmit={submit}
        onClose={() => {
          setIsFocused(false);
          // Drop DOM focus too so the next click on the input fires `focus`
          // again. Without this the input stays focused after navigation /
          // outside click and the popover never re-opens.
          inputRef.current?.blur();
        }}
        shortcutItems={shortcutItems}
        anchorRef={containerRef}
      />
    </div>
  );
}
