"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudArrowUpIcon,
  XMarkIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import type { FilePreview } from "@/src/types/account-return.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReturnFileUploadProps {
  files: FilePreview[];
  onChange: (files: FilePreview[]) => void;
  errorMessage?: string;
  /** Maximum number of files allowed @default 5 */
  maxFiles?: number;
  /** Maximum size per file in MB @default 10 */
  maxSizeMb?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReturnFileUpload — drag-and-drop file upload zone with per-file validation
 * and preview thumbnails. Supports images and videos.
 *
 * Revokes all object URLs on unmount to prevent memory leaks.
 */
export function ReturnFileUpload({
  files,
  onChange,
  errorMessage,
  maxFiles = 5,
  maxSizeMb = 10,
}: ReturnFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  const [isDragging, setIsDragging] = useState(false);

  // Keep ref in sync so the unmount cleanup captures the latest files
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => {
      filesRef.current.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, []);

  const isAtMax = files.length >= maxFiles;

  // ── File processing ───────────────────────────────────────────────────────

  const processFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles || isAtMax) return;
      const available = maxFiles - files.length;
      const toProcess = Array.from(rawFiles).slice(0, available);

      const newPreviews: FilePreview[] = toProcess.map((file) => {
        let error: string | undefined;
        if (file.size > maxSizeMb * 1024 * 1024) {
          error = `File vượt quá ${maxSizeMb}MB`;
        } else if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          error = "Chỉ chấp nhận ảnh hoặc video";
        }
        return {
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          error,
        };
      });

      onChange([...files, ...newPreviews]);
    },
    [files, isAtMax, maxFiles, maxSizeMb, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const target = files.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      onChange(files.filter((f) => f.id !== id));
    },
    [files, onChange]
  );

  // ── Drag-and-drop handlers ────────────────────────────────────────────────

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isAtMax) setIsDragging(true);
    },
    [isAtMax]
  );

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleZoneClick = useCallback(() => {
    if (!isAtMax) inputRef.current?.click();
  }, [isAtMax]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-secondary-700">
        Bằng chứng (ảnh / video)
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={isAtMax ? -1 : 0}
        aria-label="Tải lên bằng chứng"
        aria-disabled={isAtMax}
        onClick={handleZoneClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleZoneClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-150",
          isAtMax
            ? "cursor-not-allowed border-secondary-200 opacity-50"
            : isDragging
            ? "border-primary-400 bg-primary-50 cursor-pointer"
            : "border-secondary-300 hover:border-primary-400 cursor-pointer",
        ].join(" ")}
      >
        <CloudArrowUpIcon
          className="h-8 w-8 text-secondary-400"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-secondary-600">
          Kéo thả hoặc nhấn để tải lên
        </p>
        <p className="text-xs text-secondary-400">
          Tối đa {maxFiles} file · Ảnh hoặc video · Tối đa {maxSizeMb}MB mỗi
          file
        </p>
      </div>

      {/* Hidden native file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          processFiles(e.target.files);
          // Reset so the same file can be re-added after removal
          e.target.value = "";
        }}
      />

      {/* Zone-level error */}
      {errorMessage && (
        <p className="mt-1 text-xs text-error-600">{errorMessage}</p>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {files.map((f) => (
            <div key={f.id} className="flex flex-col gap-1">
              {/* Thumbnail cell */}
              <div
                className={[
                  "relative aspect-square overflow-hidden rounded-lg border bg-secondary-100",
                  f.error ? "border-error-400" : "border-secondary-200",
                ].join(" ")}
              >
                {f.file.type.startsWith("video/") ? (
                  <>
                    <video
                      src={f.previewUrl}
                      className="h-full w-full object-cover"
                      muted
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayIcon
                        className="h-6 w-6 text-white drop-shadow"
                        aria-hidden="true"
                      />
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  aria-label="Xóa file"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(f.id);
                  }}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <XMarkIcon className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>

              {/* Per-file error label */}
              {f.error && (
                <p className="text-[10px] leading-tight text-error-600">
                  {f.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
