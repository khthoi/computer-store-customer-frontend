"use client";

import { useState, useCallback } from "react";
import { ToastMessage } from "@/src/components/ui/Toast";
import { createReturn } from "@/src/services/account-return.service";
import { ReturnWizardNav } from "./ReturnWizardNav";
import { ReturnSuccessCard } from "./ReturnSuccessCard";
import { Step1SelectProducts } from "./steps/Step1SelectProducts";
import { Step2ReasonDetails } from "./steps/Step2ReasonDetails";
import { Step3Confirmation } from "./steps/Step3Confirmation";
import type {
  ReturnRequestItem,
  WizardState,
  Step1Errors,
  Step2Errors,
} from "@/src/types/account-return.types";
import type {
  OrderDetail,
  OrderDetailItem,
} from "@/src/types/account-order.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { label: "Chọn sản phẩm" },
  { label: "Lý do & Chi tiết" },
  { label: "Xác nhận" },
] as const;

const INITIAL_STATE: WizardState = {
  selectedItems: [],
  reason: "",
  resolution: "",
  description: "",
  files: [],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReturnRequestPageInnerProps {
  order: OrderDetail;
  /** Only the items the user may still return (pre-filtered for eligibility) */
  eligibleItems: OrderDetailItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ReturnRequestPageInner — 3-step wizard orchestrator.
 *
 * Owns all wizard state and validation. Passes data and handlers down as props
 * to keep step components purely presentational.
 */
export function ReturnRequestPageInner({
  order,
  eligibleItems,
}: ReturnRequestPageInnerProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnRequestId, setReturnRequestId] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);
  const [step1Errors, setStep1Errors] = useState<Step1Errors>({});
  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

  // ── State patchers ────────────────────────────────────────────────────────

  const handleStep1Change = useCallback((selectedItems: ReturnRequestItem[]) => {
    setWizardState((prev) => ({ ...prev, selectedItems }));
  }, []);

  const handleStep2Change = useCallback(
    (
      patch: Partial<
        Pick<WizardState, "reason" | "resolution" | "description" | "files">
      >
    ) => {
      setWizardState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  // ── Step 1 → 2 ────────────────────────────────────────────────────────────

  const handleNextFromStep1 = useCallback(() => {
    const errs: Step1Errors = {};

    if (wizardState.selectedItems.length === 0) {
      errs.items = "Vui lòng chọn ít nhất 1 sản phẩm để trả";
    } else {
      const hasQtyError = wizardState.selectedItems.some((si) => {
        const item = order.items.find((i) => i.id === si.itemId);
        return (
          !item ||
          si.returnQuantity < 1 ||
          si.returnQuantity > item.quantity
        );
      });
      if (hasQtyError) {
        errs.items = "Vui lòng kiểm tra lại số lượng trả hàng";
      }
    }

    if (Object.keys(errs).length > 0) {
      setStep1Errors(errs);
      return;
    }

    setStep1Errors({});
    setStep(2);
  }, [wizardState.selectedItems, order]);

  // ── Step 2 → 3 ────────────────────────────────────────────────────────────

  const handleNextFromStep2 = useCallback(() => {
    const errs: Step2Errors = {};

    if (!wizardState.reason) {
      errs.reason = "Vui lòng chọn lý do trả hàng";
    }
    if (!wizardState.resolution) {
      errs.resolution = "Vui lòng chọn phương thức xử lý";
    }
    if (wizardState.description.trim().length < 20) {
      errs.description = "Mô tả phải có ít nhất 20 ký tự";
    }
    if (wizardState.files.some((f) => f.error)) {
      errs.files = "Vui lòng xóa các file không hợp lệ trước khi tiếp tục";
    }

    if (Object.keys(errs).length > 0) {
      setStep2Errors(errs);
      return;
    }

    setStep2Errors({});
    setStep(3);
  }, [wizardState]);

  // ── Back navigation ───────────────────────────────────────────────────────

  const handleBackToStep1 = useCallback(() => setStep(1), []);
  const handleBackToStep2 = useCallback(() => setStep(2), []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const itemMap = new Map(
        order.items.map((it) => [it.id, Number(it.variantId)]),
      );
      const items = wizardState.selectedItems
        .map((s) => {
          const variantId = itemMap.get(s.itemId);
          return variantId
            ? { variantId, quantity: s.returnQuantity }
            : null;
        })
        .filter((v): v is { variantId: number; quantity: number } => v !== null);

      if (!wizardState.reason || !wizardState.resolution) {
        throw new Error("Thiếu lý do hoặc phương án xử lý.");
      }

      const result = await createReturn({
        orderNumericId: order.numericId,
        reason: wizardState.reason,
        resolution: wizardState.resolution,
        description: wizardState.description,
        items,
        images: wizardState.files
          .filter((f) => !f.error)
          .map((f) => f.file),
      });
      setReturnRequestId(result.id);
      setSubmitted(true);
    } catch (err) {
      setToastMessage(
        err instanceof Error ? err.message : "Đã xảy ra lỗi. Vui lòng thử lại.",
      );
      setToastVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [order.items, order.numericId, wizardState]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="rounded-2xl border border-secondary-200 bg-white">
        <ReturnSuccessCard returnRequestId={returnRequestId} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      {/* Step indicator */}
      <ReturnWizardNav
        currentStep={step}
        steps={WIZARD_STEPS as unknown as Array<{ label: string }>}
      />

      {/* Active step */}
      {step === 1 && (
        <Step1SelectProducts
          order={order}
          eligibleItems={eligibleItems}
          selectedItems={wizardState.selectedItems}
          onChange={handleStep1Change}
          onNext={handleNextFromStep1}
          errors={step1Errors}
        />
      )}

      {step === 2 && (
        <Step2ReasonDetails
          reason={wizardState.reason}
          resolution={wizardState.resolution}
          description={wizardState.description}
          files={wizardState.files}
          onChange={handleStep2Change}
          onNext={handleNextFromStep2}
          onBack={handleBackToStep1}
          errors={step2Errors}
        />
      )}

      {step === 3 && (
        <Step3Confirmation
          order={order}
          state={wizardState}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onBack={handleBackToStep2}
        />
      )}

      <ToastMessage
        isVisible={toastVisible}
        type="error"
        message={toastMessage}
        position="bottom-right"
        duration={3500}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
