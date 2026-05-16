import { PointsPageInner } from "@/src/components/account/points/PointsPageInner";
import {
  getEarnRules,
  getMyRedemptions,
  getPointsData,
  getRedemptionCatalog,
} from "@/src/services/account-loyalty.service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function PointsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const historyPage = Math.max(1, Number(pageParam ?? 1) || 1);

  const [data, earnRules, catalog, redemptions] = await Promise.all([
    getPointsData({ page: historyPage, limit: PAGE_SIZE }),
    getEarnRules().catch(() => []),
    getRedemptionCatalog().catch(() => []),
    getMyRedemptions().catch(() => []),
  ]);
  return (
    <PointsPageInner
      data={data}
      earnRules={earnRules}
      catalog={catalog}
      redemptions={redemptions}
      historyPage={data.historyPage}
      historyTotalPages={data.historyTotalPages}
    />
  );
}
