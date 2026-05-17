"use client";

import { useState, useCallback, useEffect, useId } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Modal, Button, Input, Textarea, Checkbox, Tooltip } from "@/src/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactVariantOption {
  value: string;
  label: string;
}

export interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Product name shown as context inside the form */
  productName?: string;
  /** Called after a successful simulated submission (before the modal closes) */
  onSuccess: () => void;
  /**
   * Flat list of variant options to display as checkboxes.
   * When exactly 1 option is provided it is auto-selected and locked.
   */
  variantOptions?: ContactVariantOption[];
  /** Values that should be checked by default when the modal opens */
  defaultSelectedVariants?: string[];
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormFields {
  name: string;
  phone: string;
  email: string;
  note: string;
}

const EMPTY_FIELDS: FormFields = { name: "", phone: "", email: "", note: "" };

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ContactModal — collects contact details from a user interested in a product.
 * Optionally displays a checkbox group so the user can specify which
 * variant configurations they want to be notified about.
 *
 * ```tsx
 * <ContactModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   productName={product.name}
 *   variantOptions={flatVariantOptions}
 *   defaultSelectedVariants={currentVariantValues}
 *   onSuccess={handleSuccess}
 * />
 * ```
 */
export function ContactModal({
  isOpen,
  onClose,
  productName,
  onSuccess,
  variantOptions = [],
  defaultSelectedVariants = [],
}: ContactModalProps) {
  const formId = useId();
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Initialise / reset variant selection whenever the modal opens ──────────
  useEffect(() => {
    if (!isOpen) return;
    // Single option → always auto-select it
    if (variantOptions.length === 1) {
      setSelectedVariants([variantOptions[0].value]);
    } else {
      setSelectedVariants(defaultSelectedVariants);
    }
  // We intentionally re-run only when `isOpen` flips to true; the deep
  // equality of the arrays is handled by the initialiser above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleField = useCallback(
    (field: keyof FormFields) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFields((prev) => ({ ...prev, [field]: e.target.value })),
    []
  );

  const toggleVariant = useCallback((value: string) => {
    setSelectedVariants((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);
      // Simulated network delay — replace with actual API call
      await new Promise((r) => setTimeout(r, 1200));
      setIsSubmitting(false);
      setFields(EMPTY_FIELDS);
      onSuccess();
      onClose();
    },
    [onClose, onSuccess]
  );

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const isSingleVariant = variantOptions.length === 1;
  const hasVariants = variantOptions.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Đăng ký nhận thông tin"
      size="md"
      animated
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button
            type="submit"
            form={formId}
            isLoading={isSubmitting}
          >
            Gửi
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Product context */}
        {productName && (
          <p className="rounded-lg bg-secondary-50 px-3 py-2 text-sm text-secondary-500">
            Sản phẩm:{" "}
            <Tooltip content={productName} placement="top" delay={150}>
              <span className="inline font-medium text-secondary-800 line-clamp-1 cursor-help underline decoration-dotted decoration-secondary-400 underline-offset-2">
                {productName}
              </span>
            </Tooltip>
          </p>
        )}

        {/* Variant selection */}
        {hasVariants && (
          <fieldset className="rounded-lg border border-secondary-200 px-3 py-3">
            <legend className="px-1 text-sm font-medium text-secondary-700">
              Cấu hình quan tâm
            </legend>
            <div className="mt-1 flex flex-col gap-2.5">
              {variantOptions.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={selectedVariants.includes(opt.value)}
                  onChange={() => toggleVariant(opt.value)}
                  // Lock the checkbox when it's the only option (auto-selected)
                  disabled={isSingleVariant}
                  size="sm"
                />
              ))}
            </div>
            {isSingleVariant && (
              <p className="mt-2 text-xs text-secondary-400">
                Cấu hình được chọn tự động vì đây là phiên bản duy nhất.
              </p>
            )}
          </fieldset>
        )}

        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          required
          autoComplete="name"
          value={fields.name}
          onChange={handleField("name")}
          fullWidth
        />

        <Input
          label="Số điện thoại"
          placeholder="0912 345 678"
          type="tel"
          required
          autoComplete="tel"
          value={fields.phone}
          onChange={handleField("phone")}
          fullWidth
        />

        <Input
          label="Email"
          placeholder="example@email.com"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleField("email")}
          fullWidth
        />

        <Textarea
          label="Nội dung / ghi chú"
          placeholder="Vui lòng để lại thông tin hoặc câu hỏi của bạn…"
          value={fields.note}
          onChange={handleField("note")}
          rows={3}
          autoResize
        />
      </form>
    </Modal>
  );
}
