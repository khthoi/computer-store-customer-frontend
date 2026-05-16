"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { PointsBadge } from "@/src/components/account/points/PointsBadge";
import { PointsHistoryTable } from "@/src/components/account/points/PointsHistoryTable";
import { PointsEarnAccordion } from "@/src/components/account/points/PointsEarnAccordion";
import { RedemptionCatalog } from "@/src/components/account/points/RedemptionCatalog";
import { Pagination } from "@/src/components/navigation/Pagination";
import type {
  EarnRule,
  PointsData,
  RedemptionCatalogItem,
  RedemptionRecord,
} from "@/src/types/account-loyalty.types";

export interface PointsPageInnerProps {
  data: PointsData;
  earnRules: EarnRule[];
  catalog: RedemptionCatalogItem[];
  redemptions: RedemptionRecord[];
  historyPage?: number;
  historyTotalPages?: number;
}

export function PointsPageInner({
  data,
  earnRules,
  catalog,
  redemptions,
  historyPage = 1,
  historyTotalPages = 1,
}: PointsPageInnerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goToPage(next: number) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <PointsBadge
          tier={data.tier}
          balance={data.balance}
          progressPercent={data.tierProgressPercent}
          pointsToNextTier={data.pointsToNextTier}
          nextTier={data.nextTier}
        />
        <div className="rounded-2xl border border-secondary-200 bg-white p-5">
          <PointsEarnAccordion rules={earnRules} />
        </div>
      </div>

      <RedemptionCatalog
        balance={data.balance}
        catalog={catalog}
        recentRedemptions={redemptions}
      />

      <div className="rounded-2xl border border-secondary-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-secondary-900">
          Lịch sử điểm thưởng
        </h2>
        <PointsHistoryTable transactions={data.history} />
        {historyTotalPages > 1 && (
          <div className="mt-4 flex justify-end">
            <Pagination
              size="sm"
              page={historyPage}
              totalPages={historyTotalPages}
              onPageChange={goToPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
