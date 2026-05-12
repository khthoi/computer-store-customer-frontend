"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { getSearchSuggestions } from "@/src/services/storefront-layout.service";
import type { SearchShortcutItem } from "@/src/types/storefront-layout.types";

export interface SearchSuggestionsPopoverProps {
  query: string;
  isFocused: boolean;
  onSubmit: (query: string) => void;
  onClose: () => void;
  shortcutItems: SearchShortcutItem[];
}

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-secondary-400">
      {label}
    </p>
  );
}

export function SearchSuggestionsPopover({
  query,
  isFocused,
  onSubmit,
  onClose,
  shortcutItems,
}: SearchSuggestionsPopoverProps) {
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [productSuggestions, setProductSuggestions] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isFocused || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("search_history");
      setHistory(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setHistory([]);
    }
  }, [isFocused]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setIsDebouncing(false);
      setProductSuggestions([]);
      return;
    }

    setIsDebouncing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setProductSuggestions(await getSearchSuggestions(trimmed));
      } catch {
        setProductSuggestions([]);
      } finally {
        setIsDebouncing(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const matchedShortcuts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return shortcutItems.slice(0, 6);
    return shortcutItems
      .filter((item) => item.label.toLowerCase().includes(trimmed))
      .slice(0, 5);
  }, [query, shortcutItems]);

  function removeHistoryEntry(entry: string) {
    const next = history.filter((item) => item !== entry);
    setHistory(next);
    try {
      localStorage.setItem("search_history", JSON.stringify(next));
    } catch {}
  }

  function clearAllHistory() {
    setHistory([]);
    try {
      localStorage.removeItem("search_history");
    } catch {}
  }

  const showHistory = isFocused && query.length === 0 && history.length > 0;
  const showSuggestions = isFocused && (query.length > 0 || matchedShortcuts.length > 0);
  const isOpen = showHistory || showSuggestions;

  if (!isOpen) return null;

  return (
    <div
      role="listbox"
      aria-label="Gợi ý tìm kiếm"
      className="absolute left-0 right-0 top-full z-[200] mt-1 overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-xl"
    >
      {showHistory && (
        <div>
          <SectionHeader label="Tìm kiếm gần đây" />
          <ul>
            {history.map((entry) => (
              <li key={entry}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSubmit(entry)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  <ClockIcon className="h-4 w-4 shrink-0 text-secondary-400" />
                  <span className="flex-1 truncate">{entry}</span>
                  <span
                    role="button"
                    aria-label={`Xóa "${entry}" khỏi lịch sử`}
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeHistoryEntry(entry);
                    }}
                    className="ml-auto rounded p-0.5 text-secondary-400 hover:text-secondary-700"
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-secondary-100 px-4 py-2">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearAllHistory}
              className="text-xs text-secondary-400 transition-colors hover:text-secondary-600"
            >
              Xóa lịch sử
            </button>
          </div>
        </div>
      )}

      {showSuggestions && (
        <>
          {matchedShortcuts.length > 0 && (
            <div className={showHistory ? "border-t border-secondary-100" : ""}>
              <SectionHeader label={query.trim() ? "Danh mục phù hợp" : "Danh mục nổi bật"} />
              <ul>
                {matchedShortcuts.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onClose();
                        router.push(item.url);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      <FolderIcon className="h-4 w-4 shrink-0 text-secondary-400" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-secondary-100">
            <SectionHeader label="Sản phẩm" />
            {isDebouncing ? (
              <div className="space-y-1 px-4 pb-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="flex items-center gap-3 py-1.5">
                    <Skeleton className="h-4 w-4 shrink-0 rounded" />
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            ) : productSuggestions.length > 0 ? (
              <ul>
                {productSuggestions.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onClose();
                        router.push(`/search?q=${encodeURIComponent(product.name)}`);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-secondary-700 hover:bg-secondary-50"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-secondary-400" />
                      <span className="truncate">{product.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 ? (
              <p className="px-4 py-3 text-sm text-secondary-400">
                Không tìm thấy sản phẩm phù hợp.
              </p>
            ) : (
              <p className="px-4 py-3 text-sm text-secondary-400">
                Nhập ít nhất 2 ký tự để xem gợi ý sản phẩm.
              </p>
            )}
          </div>

          {query.trim().length > 0 && (
            <div className="border-t border-secondary-100">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSubmit(query)}
                className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
              >
                <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
                <span>
                  Xem tất cả kết quả cho “<span className="font-semibold">{query}</span>”
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
