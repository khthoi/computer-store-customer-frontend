import { OrderListPageInner } from "@/src/components/account/orders/OrderListPageInner";
import { getMyOrders } from "@/src/services/account-order.service";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { items } = await getMyOrders({ limit: 50 });
  return <OrderListPageInner initialOrders={items} />;
}
