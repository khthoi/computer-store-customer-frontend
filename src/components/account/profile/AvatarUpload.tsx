"use client";

import { useRef, useState } from "react";
import { CameraIcon } from "@heroicons/react/24/outline";
import { Avatar } from "@/src/components/ui/Avatar";

interface AvatarUploadProps {
  name: string;
  currentSrc?: string;
  onFileSelected?: (file: File) => void;
  disabled?: boolean;
}

/**
 * AvatarUpload — circular avatar with an overlaid camera-icon upload trigger.
 * Previews the selected image locally; the actual upload happens on form save.
 */
export function AvatarUpload({ name, currentSrc, onFileSelected, disabled }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentSrc);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onFileSelected?.(file);
    // Reset so selecting the same file again triggers onChange
    e.target.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar + camera overlay */}
      <button
        type="button"
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled}
        className="group relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Thay đổi ảnh đại diện"
      >
        <Avatar src={preview} name={name} size="5xl" />

        {/* Overlay */}
        {!disabled && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            <CameraIcon className="h-6 w-6 text-white" />
          </span>
        )}
      </button>

      <p className="text-xs text-secondary-400">
        Nhấn vào ảnh để thay đổi (tối đa 3 lần/ngày)
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden
        onChange={handleFileChange}
      />
    </div>
  );
}
