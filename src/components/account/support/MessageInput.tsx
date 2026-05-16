"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";

interface AttachmentPreview {
  id:         string;
  file:       File;
  previewUrl?: string;
  name:       string;
  size:       number;
}

interface Props {
  onSend: (content: string, files: File[]) => Promise<void> | void;
  sending: boolean;
}

const MAX_FILE_SIZE  = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_COUNT = 5;
const IMAGE_MIME     = /^image\//;

function formatFileSize(bytes: number): string {
  if (bytes < 1024)              return `${bytes}B`;
  if (bytes < 1024 * 1024)       return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function MessageInput({ onSend, sending }: Props) {
  const [content,     setContent]     = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [error,       setError]       = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !sending;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";

    if (attachments.length + files.length > MAX_FILE_COUNT) {
      setError(`Tối đa ${MAX_FILE_COUNT} file mỗi lần gửi.`);
      return;
    }
    const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`File vượt quá 10MB: ${oversized.map((f) => f.name).join(", ")}`);
      return;
    }
    setError(null);

    const previews: AttachmentPreview[] = files.map((file) => ({
      id:         `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: IMAGE_MIME.test(file.type) ? URL.createObjectURL(file) : undefined,
      name:       file.name,
      size:       file.size,
    }));
    setAttachments((prev) => [...prev, ...previews]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  async function handleSend() {
    if (!canSend) return;
    const trimmed = content.trim();
    const files = attachments.map((a) => a.file);
    await onSend(trimmed, files);
    setContent("");
    attachments.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
    setAttachments([]);
    setError(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  return (
    <div className="border-t border-secondary-100 p-4">
      {error && (
        <p className="mb-2 text-xs text-error-600">{error}</p>
      )}

      {/* Attachment preview strip */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att) =>
            att.previewUrl ? (
              <div key={att.id} className="group relative h-16 w-16 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="h-16 w-16 rounded-lg border border-secondary-200 object-cover"
                />
                <button
                  type="button"
                  aria-label={`Xóa ${att.name}`}
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-700 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                key={att.id}
                className="inline-flex max-w-[200px] items-center gap-1.5 rounded-lg bg-secondary-100 py-1 pl-2.5 pr-1.5 text-xs text-secondary-700"
              >
                <span className="truncate">{att.name}</span>
                <span className="shrink-0 text-secondary-400">{formatFileSize(att.size)}</span>
                <button
                  type="button"
                  aria-label={`Xóa ${att.name}`}
                  onClick={() => removeAttachment(att.id)}
                  className="shrink-0 rounded p-0.5 transition-colors hover:bg-secondary-200"
                >
                  ×
                </button>
              </div>
            ),
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter để xuống dòng)"
        rows={3}
        disabled={sending}
        className="w-full resize-none rounded-lg border border-secondary-200 px-3 py-2 text-sm text-secondary-800 placeholder:text-secondary-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200 disabled:opacity-60"
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.zip,.txt"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          title={`Đính kèm file (tối đa ${MAX_FILE_COUNT} file, 10MB/file)`}
          onClick={() => fileInputRef.current?.click()}
          disabled={sending || attachments.length >= MAX_FILE_COUNT}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          📎 Đính kèm
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          isLoading={sending}
          disabled={!canSend}
        >
          Gửi
        </Button>
      </div>
    </div>
  );
}
