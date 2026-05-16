import { StarIcon } from "@heroicons/react/24/solid";
import type { MemberTier } from "@/src/types/account-loyalty.types";

interface PointsBadgeProps {
  tier: MemberTier;
  balance: number;
  /** 0–100 */
  progressPercent: number;
  pointsToNextTier: number;
  nextTier: MemberTier | null;
}

const TIER_COLORS: Record<MemberTier, { bg: string; text: string; star: string; bar: string }> = {
  "Đồng":     { bg: "bg-orange-50",   text: "text-orange-700",   star: "text-orange-400",  bar: "bg-orange-400" },
  "Bạc":      { bg: "bg-secondary-50", text: "text-secondary-700", star: "text-secondary-400", bar: "bg-secondary-400" },
  "Vàng":     { bg: "bg-yellow-50",   text: "text-yellow-700",   star: "text-yellow-500",  bar: "bg-yellow-400" },
  "Bạch Kim": { bg: "bg-primary-50",  text: "text-primary-700",  star: "text-primary-500", bar: "bg-primary-500" },
};

/**
 * PointsBadge — hero card showing current balance, tier, and progress to next tier.
 */
export function PointsBadge({
  tier,
  balance,
  progressPercent,
  pointsToNextTier,
  nextTier,
}: PointsBadgeProps) {
  const colors = TIER_COLORS[tier];

  return (
    <div
      className={[
        "rounded-2xl border border-secondary-200 p-6",
        colors.bg,
      ].join(" ")}
    >
      {/* Tier label */}
      <div className="flex items-center gap-2 mb-4">
        <StarIcon className={`h-5 w-5 ${colors.star}`} />
        <span className={`text-sm font-semibold ${colors.text}`}>
          Thành viên {tier}
        </span>
      </div>

      {/* Balance */}
      <p className="text-4xl font-bold text-secondary-900 tabular-nums">
        {balance.toLocaleString("vi-VN")}
        <span className="ml-2 text-lg font-medium text-secondary-500">điểm</span>
      </p>

      {/* Progress to next tier */}
      {nextTier && (
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-secondary-500">
            <span>Cấp hiện tại: {tier}</span>
            <span>Cấp tiếp theo: {nextTier}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary-200">
            <div
              className={["h-2 rounded-full transition-all duration-500", colors.bar].join(" ")}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-secondary-500">
            Cần thêm{" "}
            <span className="font-semibold text-secondary-800">
              {pointsToNextTier.toLocaleString("vi-VN")} điểm
            </span>{" "}
            để lên hạng <span className="font-semibold">{nextTier}</span>.
          </p>
        </div>
      )}

      {!nextTier && (
        <p className="mt-4 text-sm font-medium text-primary-600">
          Bạn đã đạt cấp cao nhất!
        </p>
      )}
    </div>
  );
}
