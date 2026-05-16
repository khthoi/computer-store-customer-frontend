import { notFound, redirect } from "next/navigation";
import { SuccessPageInner } from "@/src/components/checkout/success/SuccessPageInner";
import {
  getOrderRecommendations,
  getOrderSuccessSummary,
} from "@/src/services/checkout-success.service";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const orderIdRaw = firstParam(sp.orderId);
  const orderId = Number(orderIdRaw);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    redirect("/account/orders");
  }

  let order;
  try {
    order = await getOrderSuccessSummary(orderId);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404 || status === 403) notFound();
    throw err;
  }

  const recommended = await getOrderRecommendations(orderId, 10).catch(() => []);

  return <SuccessPageInner order={order} recommendedProducts={recommended} />;
}
