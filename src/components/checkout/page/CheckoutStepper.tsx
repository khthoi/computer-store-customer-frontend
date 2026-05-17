import { CheckIcon } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckoutStepperProps {
  steps: string[];
  /** 0-indexed index of the active step */
  currentStep: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CheckoutStepper — pure presentational step indicator.
 *
 * Desktop: horizontal numbered step bar with connecting lines.
 * Mobile:  "Step X / N" label + thin progress bar.
 *
 * Layout:
 *   <ol> is a bounded flex row (max-w-2xl mx-auto).
 *   Steps (<li> shrink-0) alternate with lines (<li> flex-1) via flatMap.
 *   The line sits at the <ol> level so flex-1 actually stretches between
 *   step circles — it is NOT nested inside the step <li>.
 */
export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  return (
    <>
      {/* ── Desktop: horizontal step bar ──────────────────────────────── */}
      <nav aria-label="Tiến trình đặt hàng" className="hidden sm:block mb-8">
        <ol className="flex items-start w-full max-w-4xl mx-auto">
          {steps.flatMap((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            // ── Step item ──────────────────────────────────────────────
            const stepItem = (
              <li key={label} className="flex shrink-0 flex-col items-center">
                {/* Circle */}
                <div
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-200",
                    isCompleted
                      ? "border-primary-600 bg-primary-600"
                      : isCurrent
                        ? "border-primary-600 bg-white"
                        : "border-secondary-300 bg-white",
                  ].join(" ")}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={[
                        "text-xs font-bold",
                        isCurrent ? "text-primary-600" : "text-secondary-400",
                      ].join(" ")}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={[
                    "mt-2 text-xs font-medium whitespace-nowrap",
                    isCurrent
                      ? "text-primary-600"
                      : isCompleted
                        ? "text-secondary-700"
                        : "text-secondary-400",
                  ].join(" ")}
                >
                  {label}
                </span>
              </li>
            );

            // ── Connecting line — sibling to step, NOT nested inside it ──
            // flex-1 stretches between the two adjacent step circles.
            // mt-4 (16px) vertically centers the line with the h-8 (32px) circle.
            if (index < steps.length - 1) {
              return [
                stepItem,
                <li
                  key={`line-${index}`}
                  aria-hidden="true"
                  className={[
                    "flex-1 h-0.5 shrink mt-4 mx-3 transition-colors duration-200",
                    index < currentStep ? "bg-primary-600" : "bg-secondary-200",
                  ].join(" ")}
                />,
              ];
            }

            return [stepItem];
          })}
        </ol>
      </nav>

      {/* ── Mobile: step X of N + progress bar ───────────────────────── */}
      <div className="sm:hidden mb-6" aria-label="Tiến trình đặt hàng">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary-700">
            Bước {currentStep + 1} / {steps.length}
          </span>
          <span className="text-sm text-secondary-500">
            {steps[currentStep]}
          </span>
        </div>
        <div
          className="h-1.5 w-full rounded-full bg-secondary-200"
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
        >
          <div
            className="h-1.5 rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </>
  );
}
