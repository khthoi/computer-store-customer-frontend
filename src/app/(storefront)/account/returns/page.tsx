import { ReturnRequestList } from "@/src/components/account/returns/ReturnRequestList";
import { getMyReturns } from "@/src/services/account-return.service";
import { getMyOrders } from "@/src/services/account-order.service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ReturnsPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  const [paginated, orders] = await Promise.all([
    getMyReturns({ page, limit: PAGE_SIZE }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: PAGE_SIZE,
      totalPages: 0,
    })),
    getMyOrders({ limit: 100 }).then((r) => r.items).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-secondary-900">Yêu cầu đổi/trả</h1>
      <ReturnRequestList
        requests={paginated.items}
        orders={orders}
        page={paginated.page}
        totalPages={paginated.totalPages}
      />
    </div>
  );
}
