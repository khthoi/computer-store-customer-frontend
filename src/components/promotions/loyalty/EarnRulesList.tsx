import { CalculatorIcon, GiftIcon } from "@heroicons/react/24/outline";
import { formatVND } from "@/src/lib/format";
import type {
  LoyaltyEarnRule,
  LoyaltyEarnRuleScope,
} from "@/src/types/loyalty.types";

export interface EarnRulesListProps {
  rules: LoyaltyEarnRule[];
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPoints(n: number): string {
  return n.toLocaleString("vi-VN");
}

function ruleHeadline(rule: LoyaltyEarnRule): string {
  const spend = formatVND(rule.spendPerUnit);
  const pts = formatPoints(rule.pointsPerUnit);
  return `Cứ ${spend} chi tiêu = ${pts} điểm`;
}

function bonusText(rule: LoyaltyEarnRule): string | null {
  if (!rule.bonusTrigger || !rule.bonusPoints) return null;
  const label: Record<NonNullable<LoyaltyEarnRule["bonusTrigger"]>, string> = {
    first_order: "đơn hàng đầu tiên",
    birthday: "sinh nhật khách hàng",
    manual: "trao thủ công bởi quản trị viên",
  };
  return `Tặng thêm ${formatPoints(rule.bonusPoints)} điểm thưởng cho ${label[rule.bonusTrigger]}.`;
}

function scopeLine(scope: LoyaltyEarnRuleScope): string {
  const kind =
    scope.scopeType === "category"
      ? "Danh mục"
      : scope.scopeType === "brand"
        ? "Thương hiệu"
        : "Sản phẩm";
  return `${kind} "${scope.scopeRefLabel}" — hệ số x${scope.multiplier}`;
}

export function EarnRulesList({ rules }: EarnRulesListProps) {
  if (rules.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-secondary-200 bg-secondary-50 p-6 text-center text-sm text-secondary-500">
        Hiện chưa có quy tắc tích điểm nào đang hoạt động.
      </section>
    );
  }

  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <section>
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <CalculatorIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-secondary-900">
            Cách tích điểm
          </h2>
          <p className="mt-0.5 text-sm text-secondary-500">
            Các công thức tích điểm hiện đang áp dụng. Đơn hàng có thể thỏa nhiều
            quy tắc và sẽ được cộng dồn theo thứ tự ưu tiên cấu hình.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((rule) => {
          const bonus = bonusText(rule);
          const validFrom = formatDate(rule.validFrom);
          const validUntil = formatDate(rule.validUntil);

          return (
            <article
              key={rule.id}
              className="flex h-full flex-col rounded-2xl border border-secondary-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold text-secondary-900">
                {rule.name}
              </h3>

              <p className="mt-3 text-base font-semibold text-primary-700">
                {ruleHeadline(rule)}
              </p>

              {rule.description ? (
                <p className="mt-2 text-sm text-secondary-700">
                  {rule.description}
                </p>
              ) : null}

              <ul className="mt-3 space-y-1 text-xs text-secondary-600">
                {rule.minOrderValue != null ? (
                  <li>Áp dụng khi đơn hàng tối thiểu {formatVND(rule.minOrderValue)}.</li>
                ) : null}
                {rule.maxPointsPerOrder != null ? (
                  <li>Tối đa {formatPoints(rule.maxPointsPerOrder)} điểm cho mỗi đơn.</li>
                ) : null}
                {rule.scopes.length > 0 ? (
                  <li>
                    <span className="font-medium text-secondary-700">Phạm vi đặc biệt:</span>
                    <ul className="mt-1 list-disc space-y-0.5 pl-5">
                      {rule.scopes.map((s) => (
                        <li key={s.id}>{scopeLine(s)}</li>
                      ))}
                    </ul>
                  </li>
                ) : null}
              </ul>

              {bonus ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  <GiftIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{bonus}</span>
                </div>
              ) : null}

              {(validFrom || validUntil) ? (
                <p className="mt-3 text-xs text-secondary-500">
                  Hiệu lực: {validFrom ?? "không giới hạn"} – {validUntil ?? "không giới hạn"}.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
