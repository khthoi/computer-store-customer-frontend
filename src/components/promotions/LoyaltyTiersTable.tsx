import { TrophyIcon } from "@heroicons/react/24/outline";
import type { LoyaltyTier } from "@/src/types/loyalty.types";

export interface LoyaltyTiersTableProps {
  tiers: LoyaltyTier[];
}

function formatPoints(n: number): string {
  return n.toLocaleString("vi-VN");
}

function rangeText(tier: LoyaltyTier): string {
  if (tier.maxPoints == null) {
    return `Từ ${formatPoints(tier.minPoints)} điểm trở lên`;
  }
  return `${formatPoints(tier.minPoints)} – ${formatPoints(tier.maxPoints)} điểm`;
}

/**
 * LoyaltyTiersTable — visual ladder of membership tiers configured by admin.
 * Renders nothing when no tiers are returned.
 */
export function LoyaltyTiersTable({ tiers }: LoyaltyTiersTableProps) {
  if (tiers.length === 0) return null;

  const sorted = [...tiers].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.minPoints - b.minPoints;
  });

  return (
    <section className="rounded-2xl border border-secondary-200 bg-white p-5">
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <TrophyIcon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-secondary-900">
            Hạng thành viên
          </h2>
          <p className="mt-0.5 text-sm text-secondary-500">
            Số điểm tích lũy lũy kế quyết định hạng thành viên của bạn. Hạng càng
            cao, ưu đãi càng nhiều.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((tier) => (
          <article
            key={tier.id}
            className="rounded-xl border border-secondary-200 bg-secondary-50/40 p-4"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: tier.color ?? "#94a3b8" }}
              />
              <h3 className="text-sm font-semibold text-secondary-900">
                {tier.displayName}
              </h3>
            </div>
            <p className="mt-2 text-xs font-medium text-secondary-700">
              {rangeText(tier)}
            </p>
            {tier.description ? (
              <p className="mt-1.5 text-xs text-secondary-500">
                {tier.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
