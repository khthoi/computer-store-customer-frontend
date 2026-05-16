import { notFound } from "next/navigation";
import { ReturnRequestDetailCard } from "@/src/components/account/returns/ReturnRequestDetailCard";
import { getMyReturnDetail } from "@/src/services/account-return.service";
import { getMyOrders } from "@/src/services/account-order.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ return_id: string }>;
}

export default async function ReturnRequestDetailPage({ params }: Props) {
  const { return_id } = await params;

  let request;
  try {
    request = await getMyReturnDetail(return_id);
  } catch {
    notFound();
  }

  const orders = await getMyOrders({ limit: 100 }).then((r) => r.items);
  const order = orders.find((o) => o.id === request.orderId);
  if (!order) notFound();

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white">
      <ReturnRequestDetailCard request={request} order={order} />
    </div>
  );
}
