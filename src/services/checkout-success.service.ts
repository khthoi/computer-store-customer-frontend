import { apiFetch } from "@/src/services/api";
import type {
  RecommendedProduct,
  SuccessOrder,
} from "@/src/types/checkout-success.types";

export async function getOrderSuccessSummary(orderId: number): Promise<SuccessOrder> {
  return apiFetch<SuccessOrder>(`/orders/${orderId}/success-summary`);
}

export async function getOrderRecommendations(
  orderId: number,
  limit = 10,
): Promise<RecommendedProduct[]> {
  return apiFetch<RecommendedProduct[]>(
    `/orders/${orderId}/recommendations?limit=${limit}`,
  );
}
