"use client";

import { useCallback, useRef, useState } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { RatingStars } from "@/src/components/product/atoms/RatingStars";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Tuyệt vời",
};

const MAX_IMAGES = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewFormModal({
  isOpen,
  onClose,
  productId: _productId,
  productName,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    content?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const remaining = MAX_IMAGES - images.length;
      const toAdd = files.slice(0, remaining);

      toAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result;
          if (typeof result === "string") {
            setImages((prev) => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      });

      // Reset file input so the same file can be re-added after removal
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [images.length]
  );

  const removeImage = useCallback((idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const validate = useCallback(() => {
    const newErrors: typeof errors = {};
    if (rating === 0) newErrors.rating = "Vui lòng chọn số sao đánh giá.";
    if (content.trim().length < 20)
      newErrors.content = "Nội dung đánh giá phải có ít nhất 20 ký tự.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rating, content]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    onClose();
    // Reset form
    setRating(0);
    setTitle("");
    setContent("");
    setImages([]);
    setErrors({});
  }, [validate, onClose]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Viết đánh giá của bạn"
      size="lg"
      footer={
        <Button
          variant="primary"
          fullWidth
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Gửi đánh giá
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Product name context */}
        <p className="text-sm text-secondary-500">
          Đánh giá cho:{" "}
          <span className="font-medium text-secondary-800">{productName}</span>
        </p>

        {/* Star rating input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-secondary-700">
            Đánh giá tổng thể <span className="text-error-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <RatingStars
              value={rating}
              mode="input"
              size="lg"
              onChange={setRating}
            />
            {rating > 0 && (
              <span className="text-sm font-medium text-secondary-700">
                {RATING_LABELS[rating]}
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="text-xs text-error-600">{errors.rating}</p>
          )}
        </div>

        {/* Title input */}
        <Input
          label="Tiêu đề đánh giá"
          placeholder="Tóm tắt trải nghiệm của bạn"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="md"
          fullWidth
        />

        {/* Content textarea */}
        <Textarea
          label="Nội dung đánh giá"
          placeholder="Chia sẻ chi tiết về sản phẩm: chất lượng, hiệu năng, trải nghiệm sử dụng..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          showCharCount
          maxCount={1000}
          autoResize
          rows={4}
          errorMessage={errors.content}
        />

        {/* Image upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-secondary-700">
            Hình ảnh thực tế{" "}
            <span className="font-normal text-secondary-400">
              (tối đa {MAX_IMAGES} ảnh)
            </span>
          </label>

          {/* Preview strip */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((src, idx) => (
                <div key={idx} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Ảnh ${idx + 1}`}
                    className="w-[72px] h-[72px] rounded-lg object-cover border border-secondary-200"
                  />
                  <button
                    type="button"
                    aria-label={`Xóa ảnh ${idx + 1}`}
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-white hover:bg-error-600 focus-visible:outline-none"
                  >
                    <XMarkIcon className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload trigger */}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              aria-label="Thêm hình ảnh đánh giá"
              onClick={() => fileInputRef.current?.click()}
              className={[
                "flex flex-col items-center justify-center gap-2 rounded-xl p-6 text-center transition-colors",
                "border-2 border-dashed border-secondary-300",
                "hover:border-primary-400 hover:bg-primary-50 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              ].join(" ")}
            >
              <PhotoIcon className="w-8 h-8 text-secondary-400" aria-hidden="true" />
              <span className="text-sm text-secondary-500">
                Thêm hình ảnh{" "}
                <span className="text-secondary-400">
                  ({images.length}/{MAX_IMAGES})
                </span>
              </span>
            </button>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            aria-hidden="true"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </Modal>
  );
}
