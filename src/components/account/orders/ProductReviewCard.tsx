"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { RatingStars } from "@/src/components/product/RatingStars";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { ReturnFileUpload } from "@/src/components/account/returns/ReturnFileUpload";
import type { FilePreview } from "@/src/types/account-return.types";
import type { OrderDetailItem } from "@/src/types/account-order.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: "Rất tệ",
  2: "Tệ",
  3: "Bình thường",
  4: "Tốt",
  5: "Tuyệt vời",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductReviewFormData {
  rating: number;
  title: string;
  content: string;
  files: File[];
}

export interface ProductReviewCardHandle {
  triggerSubmit: () => Promise<void>;
}

export interface ProductReviewCardProps {
  item: OrderDetailItem;
  onSubmit: (itemId: string, data: ProductReviewFormData) => Promise<void>;
  /** Disables the submit button during bulk submission */
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductReviewCard — per-item review form inside the order review modal.
 *
 * When `item.review` is already set, renders a read-only success state instead
 * of the form. Exposes `triggerSubmit()` via ref for bulk submission.
 */
export const ProductReviewCard = forwardRef<
  ProductReviewCardHandle,
  ProductReviewCardProps
>(function ProductReviewCard({ item, onSubmit, disabled = false }, ref) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; content?: string }>(
    {}
  );

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
    try {
      await onSubmit(item.id, {
        rating,
        title,
        content,
        files: files.filter((f) => !f.error).map((f) => f.file),
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, item.id, rating, title, content, files]);

  useImperativeHandle(ref, () => ({ triggerSubmit: handleSubmit }), [
    handleSubmit,
  ]);

  // ── Header (always rendered) ───────────────────────────────────────────────

  const header = (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-secondary-100 bg-secondary-50">
        <Image
          src={item.thumbnailSrc}
          alt={item.name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-secondary-900">
          {item.name}
        </p>
        {item.variantLabel && (
          <p className="text-xs text-secondary-400">{item.variantLabel}</p>
        )}
      </div>
    </div>
  );

  // ── Submitted state ────────────────────────────────────────────────────────

  if (item.review) {
    const reviewImages = item.review.images ?? [];
    return (
      <div className="flex flex-col gap-4">
        {header}
        <hr className="border-secondary-100" />
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircleIcon
            className="h-10 w-10 text-success-500"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-secondary-900">
              Cảm ơn đánh giá của bạn!
            </p>
            <Badge
              variant={item.review.status === "approved" ? "success" : "warning"}
              dot
            >
              {item.review.status === "approved" ? "Đã duyệt" : "Đang chờ duyệt"}
            </Badge>
          </div>
          <RatingStars mode="display" value={item.review.rating} size="md" />
          {reviewImages.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {reviewImages.map((url, idx) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block h-16 w-16 overflow-hidden rounded-lg border border-secondary-200"
                >
                  <Image
                    src={url}
                    alt={`Ảnh đánh giá ${idx + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {header}

      <hr className="border-secondary-100" />

      {/* Rating */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-secondary-700">
          Đánh giá tổng thể <span className="text-error-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <RatingStars
            mode="input"
            size="lg"
            value={rating}
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

      {/* Title */}
      <Input
        label="Tiêu đề"
        placeholder="Tóm tắt trải nghiệm của bạn"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        size="md"
        fullWidth
      />

      {/* Content */}
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

      {/* Media upload */}
      <ReturnFileUpload files={files} onChange={setFiles} maxFiles={5} />

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitting || disabled}
          onClick={handleSubmit}
        >
          Gửi đánh giá
        </Button>
      </div>
    </div>
  );
});
