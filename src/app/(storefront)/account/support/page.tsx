import { SupportPageInner } from "@/src/components/account/support/SupportPageInner";
import { getMyTickets } from "@/src/services/account-support.service";
import { getMyOrders } from "@/src/services/account-order.service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function SupportPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);

  const [paginated, ordersResult] = await Promise.all([
    getMyTickets({ page, limit: PAGE_SIZE }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: PAGE_SIZE,
      totalPages: 0,
    })),
    getMyOrders({ limit: 20 }).catch(() => ({ items: [], total: 0, totalPages: 0 })),
  ]);

  return (
    <SupportPageInner
      tickets={paginated.items}
      page={paginated.page}
      totalPages={paginated.totalPages}
      orders={ordersResult.items}
      totalOrders={ordersResult.total}
    />
  );
}
