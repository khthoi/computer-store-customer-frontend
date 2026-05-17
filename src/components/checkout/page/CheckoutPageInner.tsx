"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { CheckoutStepper } from "@/src/components/checkout/page/CheckoutStepper";
import {
  CustomerInfoForm,
  type CustomerInfoFormRef,
} from "@/src/components/checkout/customer/CustomerInfoForm";
import { ShippingMethodSelector } from "@/src/components/checkout/methods/ShippingMethodSelector";
import { PaymentMethodSelector } from "@/src/components/checkout/methods/PaymentMethodSelector";
import { CheckoutOrderSummary } from "@/src/components/checkout/summary/CheckoutOrderSummary";
import { OrderNoteField } from "@/src/components/checkout/summary/OrderNoteField";
import { useCheckout, type CheckoutStep } from "@/src/store/checkout.store";
import { useCart } from "@/src/store/cart.store";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS: CheckoutStep[] = ["information", "shipping", "payment", "confirm"];
const STEP_LABELS = ["Thông tin", "Vận chuyển", "Thanh toán", "Xác nhận"];

// ─── Sub-component: confirmation review ───────────────────────────────────────

function OrderConfirmView() {
  const { state, shippingMethods, paymentMethods, goToStep } = useCheckout();
  const { form, shippingMethodId, paymentMethodId } = state;

  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId);
  const selectedPayment = paymentMethods.find((m) => m.id === paymentMethodId);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-secondary-900">
        Xác nhận đơn hàng
      </h2>

      {/* Delivery address */}
      <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
            Địa chỉ giao hàng
          </p>
          <button
            type="button"
            onClick={() => goToStep("information")}
            className="text-xs text-primary-600 hover:underline"
          >
            Sửa
          </button>
        </div>
        <p className="text-sm font-medium text-secondary-900">{form.fullName}</p>
        <p className="text-sm text-secondary-600 mt-0.5">
          {form.phone} · {form.email}
        </p>
        <p className="text-sm text-secondary-600 mt-0.5">
          {[form.addressDetail, form.ward, form.district, form.province]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

      {/* Shipping */}
      {selectedShipping && (
        <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
              Vận chuyển
            </p>
            <button
              type="button"
              onClick={() => goToStep("shipping")}
              className="text-xs text-primary-600 hover:underline"
            >
              Sửa
            </button>
          </div>
          <p className="text-sm font-medium text-secondary-900">
            {selectedShipping.name}
          </p>
          <p className="text-xs text-secondary-500 mt-0.5">
            {selectedShipping.estimatedDays}
          </p>
        </div>
      )}

      {/* Payment */}
      {selectedPayment && (
        <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
              Thanh toán
            </p>
            <button
              type="button"
              onClick={() => goToStep("payment")}
              className="text-xs text-primary-600 hover:underline"
            >
              Sửa
            </button>
          </div>
          <p className="text-sm font-medium text-secondary-900">
            {selectedPayment.name}
          </p>
        </div>
      )}

      {/* Note */}
      {form.note && (
        <div className="rounded-xl bg-secondary-50 border border-secondary-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-1">
            Ghi chú
          </p>
          <p className="text-sm text-secondary-700">{form.note}</p>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CheckoutPageInner — top-level client orchestrator for /checkout.
 *
 * Reads useCart() for items/coupon and useCheckout() for step/form/methods.
 * Renders progress stepper + step-gated left column + sticky right summary.
 * AnimatePresence handles direction-aware slide transitions between steps.
 */
export function CheckoutPageInner() {
  const router = useRouter();
  const {
    state,
    shippingMethods,
    paymentMethods,
    setShipping,
    setPayment,
    goToStep,
    submitOrder,
  } = useCheckout();
  const { state: cartState } = useCart();

  const formRef = useRef<CustomerInfoFormRef>(null);
  // Track animation direction: +1 = forward (slide left), -1 = back (slide right)
  const directionRef = useRef(1);

  const currentStepIndex = STEPS.indexOf(state.step);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Disable "Continue" when a required selection is missing.
  const isContinueBlocked =
    (state.step === "shipping" && !state.shippingMethodId) ||
    (state.step === "payment" && !state.paymentMethodId);

  const handleNext = useCallback(async () => {
    // Validate customer info form on the first step.
    if (state.step === "information") {
      const valid = formRef.current?.validate() ?? false;
      if (!valid) return;
    }

    if (isLastStep) {
      directionRef.current = 1;
      const success = await submitOrder();
      if (success) {
        router.push("/checkout/success");
      }
      return;
    }

    directionRef.current = 1;
    goToStep(STEPS[currentStepIndex + 1]!);
  }, [state.step, isLastStep, currentStepIndex, goToStep, submitOrder, router]);

  const handleBack = useCallback(() => {
    if (isFirstStep) return;
    directionRef.current = -1;
    goToStep(STEPS[currentStepIndex - 1]!);
  }, [isFirstStep, currentStepIndex, goToStep]);

  // If cart is empty, show a friendly empty state.
  if (cartState.hydrated && cartState.items.length === 0) {
    return (
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-24 flex flex-col items-center gap-4 text-center">
        <ShoppingBagIcon className="h-16 w-16 text-secondary-300" />
        <h1 className="text-xl font-semibold text-secondary-700">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="text-sm text-secondary-400">
          Thêm sản phẩm vào giỏ hàng trước khi thanh toán.
        </p>
        <Button variant="primary" onClick={() => router.push("/products")}>
          Tiếp tục mua sắm
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Page heading + back-to-cart */}
      <div className="flex flex-col items-start gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cart")}
          leftIcon={<ChevronLeftIcon />}
        >
          Giỏ hàng
        </Button>
        <h1 className="text-2xl font-bold text-secondary-900">Thanh toán</h1>
      </div>
      {/* Progress stepper — lives above the card, spans only this column */}
      <CheckoutStepper steps={STEP_LABELS} currentStep={currentStepIndex} />

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">

        {/* ── Left: stepper + step content ───────────────────────────── */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-secondary-200 bg-white p-6">
            
            {/* Animated step content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={state.step}
                initial={{ opacity: 0, x: directionRef.current * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: directionRef.current * -32 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {state.step === "information" && (
                  <>
                    <CustomerInfoForm ref={formRef} />
                    <OrderNoteField />
                  </>
                )}

                {state.step === "shipping" && (
                  <ShippingMethodSelector
                    options={shippingMethods}
                    selectedId={state.shippingMethodId}
                    onChange={setShipping}
                  />
                )}

                {state.step === "payment" && (
                  <PaymentMethodSelector
                    options={paymentMethods}
                    selectedId={state.paymentMethodId}
                    onChange={setPayment}
                  />
                )}

                {state.step === "confirm" && <OrderConfirmView />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-secondary-100">
              <div>
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleBack}
                    leftIcon={<ChevronLeftIcon />}
                    disabled={state.submitting}
                  >
                    Quay lại
                  </Button>
                )}
              </div>

              <Button
                variant={isLastStep ? "danger" : "primary"}
                size="md"
                onClick={handleNext}
                isLoading={state.submitting}
                disabled={isContinueBlocked}
                rightIcon={!isLastStep ? <ChevronRightIcon /> : undefined}
              >
                {isLastStep ? "Đặt hàng" : "Tiếp tục"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right: sticky order summary ────────────────────────────── */}
        <aside aria-label="Tóm tắt đơn hàng">
          <CheckoutOrderSummary />
        </aside>
      </div>
    </main>
  );
}
