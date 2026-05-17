import type { OrderSummary } from "@/src/types/account-order.types";
import type { ReturnRequest } from "@/src/types/account-return.types";

/**
 * Returns the subset of order items that are still eligible for return.
 *
 * An item is INELIGIBLE when it is already covered by any return request
 * whose status is NOT "rejected" (i.e. submitted | processing | approved).
 * A rejected request releases the item so the user may retry.
 */
export function getEligibleItems<T extends { id: string }>(
  orderItems: T[],
  existingRequests: ReturnRequest[]
): T[] {
  const coveredItemIds = new Set<string>();

  for (const req of existingRequests) {
    if (req.status !== "rejected") {
      for (const ri of req.items) {
        coveredItemIds.add(ri.itemId);
      }
    }
  }

  return orderItems.filter((item) => !coveredItemIds.has(item.id));
}

/**
 * Returns true when the order has at least one item still eligible for return
 * AND the order is still within its return window.
 *
 * Returns false when:
 * - order is not "delivered"
 * - deliveredAt is absent
 * - the return window has passed
 * - all items are already covered by active return requests
 */
export function canOrderBeReturned(
  order: OrderSummary,
  existingRequests: ReturnRequest[]
): boolean {
  if (order.status !== "delivered" || !order.deliveredAt) return false;

  const windowDays = order.returnWindowDays ?? 7;
  const deadline = new Date(order.deliveredAt);
  deadline.setDate(deadline.getDate() + windowDays);
  if (new Date() > deadline) return false;

  return getEligibleItems(order.items, existingRequests).length > 0;
}
