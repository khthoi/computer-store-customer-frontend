import { notFound } from "next/navigation";
import { OrderDetailPageInner } from "@/src/components/account/orders/page/OrderDetailPageInner";
import { getOrderDetail } from "@/src/services/account-order.service";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ action?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { action } = await searchParams;
  const numericId = Number(orderId);
  if (!Number.isInteger(numericId)) notFound();

  try {
    const order = await getOrderDetail(numericId);
    return (
      <OrderDetailPageInner
        order={order}
        initialReviewOpen={action === "review"}
      />
    );
  } catch {
    notFound();
  }
}
