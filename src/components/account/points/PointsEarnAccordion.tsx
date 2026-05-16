import {
  ShoppingBagIcon,
  GiftIcon,
  CakeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Accordion } from "@/src/components/ui/Accordion";
import type { AccordionItemDef } from "@/src/components/ui/Accordion";
import type { EarnRule } from "@/src/types/account-loyalty.types";

interface Props {
  rules: EarnRule[];
}

function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + "₫";
}

function formatPoints(points: number): string {
  return points.toLocaleString("vi-VN") + " điểm";
}

function isSpendingRule(r: EarnRule): boolean {
  return r.bonusTrigger === null && r.spendPerUnit > 0 && r.pointsPerUnit > 0;
}

function getRuleIcon(r: EarnRule) {
  if (r.bonusTrigger === "birthday") return <CakeIcon />;
  if (r.bonusTrigger === "first_order") return <SparklesIcon />;
  if (r.bonusTrigger === "manual") return <GiftIcon />;
  return <ShoppingBagIcon />;
}

function SpendingRuleBody({ r }: { r: EarnRule }) {
  // Compute a friendly example: pick an order value that's a round multiple
  // of spendPerUnit, at least 5x. Respect minOrderValue if higher.
  const baseUnit = r.spendPerUnit;
  const minOrder = r.minOrderValue ?? 0;
  const exampleOrder = Math.max(baseUnit * 5, minOrder, 500_000);
  let exampleEarned = Math.floor(exampleOrder / baseUnit) * r.pointsPerUnit;
  if (r.maxPointsPerOrder != null && exampleEarned > r.maxPointsPerOrder) {
    exampleEarned = r.maxPointsPerOrder;
  }

  return (
    <div className="space-y-2 text-secondary-600">
      <p>
        Tích <strong>{formatPoints(r.pointsPerUnit)}</strong> cho mỗi{" "}
        <strong>{formatVND(r.spendPerUnit)}</strong> chi tiêu.
      </p>
      {r.description && (
        <p className="text-xs text-secondary-500">{r.description}</p>
      )}

      <ul className="space-y-1 text-xs text-secondary-500">
        {r.minOrderValue != null && r.minOrderValue > 0 && (
          <li>
            • Áp dụng cho đơn hàng từ{" "}
            <strong>{formatVND(r.minOrderValue)}</strong> trở lên.
          </li>
        )}
        {r.maxPointsPerOrder != null && (
          <li>
            • Tích tối đa <strong>{formatPoints(r.maxPointsPerOrder)}</strong>{" "}
            cho mỗi đơn.
          </li>
        )}
        <li>
          • Điểm được cộng sau khi đơn chuyển sang trạng thái{" "}
          <em>Đã giao</em>.
        </li>
      </ul>

      <div className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
        <p className="font-semibold">Ví dụ:</p>
        <p>
          Đơn hàng <strong>{formatVND(exampleOrder)}</strong> → bạn nhận{" "}
          <strong>{formatPoints(exampleEarned)}</strong>.
        </p>
      </div>
    </div>
  );
}

function BonusRuleBody({ r }: { r: EarnRule }) {
  const bonusPoints = r.bonusPoints ?? 0;
  let triggerText: string;
  let example: string;
  switch (r.bonusTrigger) {
    case "first_order":
      triggerText = "Thưởng khi bạn hoàn tất đơn hàng đầu tiên.";
      example = `Hoàn tất đơn hàng đầu tiên → nhận ngay ${formatPoints(bonusPoints)}.`;
      break;
    case "birthday":
      triggerText =
        "Thưởng vào đúng ngày sinh nhật của bạn (cần điền ngày sinh trong hồ sơ).";
      example = `Đến sinh nhật → tự động cộng ${formatPoints(bonusPoints)} lúc 00:00.`;
      break;
    case "manual":
      triggerText =
        "Điểm thưởng do nhân viên CSKH cấp thủ công (chương trình tri ân, đền bù, v.v.).";
      example = `Khi được duyệt → bạn nhận ${formatPoints(bonusPoints)}.`;
      break;
    default:
      triggerText = r.description || "Phần thưởng đặc biệt.";
      example = bonusPoints > 0 ? `Bạn nhận ${formatPoints(bonusPoints)}.` : "";
  }

  return (
    <div className="space-y-2 text-secondary-600">
      <p>
        <strong>Thưởng {formatPoints(bonusPoints)}</strong> · {triggerText}
      </p>
      {r.description && r.description !== triggerText && (
        <p className="text-xs text-secondary-500">{r.description}</p>
      )}
      {example && (
        <div className="mt-2 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
          <p className="font-semibold">Ví dụ:</p>
          <p>{example}</p>
        </div>
      )}
    </div>
  );
}

export function PointsEarnAccordion({ rules }: Props) {
  if (rules.length === 0) {
    return (
      <div>
        <h2 className="mb-3 text-base font-semibold text-secondary-900">
          Cách tích điểm
        </h2>
        <p className="text-sm text-secondary-400">
          Hệ thống chưa cấu hình quy tắc tích điểm nào đang hoạt động.
        </p>
      </div>
    );
  }

  const items: AccordionItemDef[] = rules.map((r) => ({
    value: r.id,
    label: r.name,
    icon: getRuleIcon(r),
    children: isSpendingRule(r) ? (
      <SpendingRuleBody r={r} />
    ) : (
      <BonusRuleBody r={r} />
    ),
  }));

  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-secondary-900">
        Cách tích điểm
      </h2>
      <Accordion items={items} variant="separated" multiple />
    </div>
  );
}
