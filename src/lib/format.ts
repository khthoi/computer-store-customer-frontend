/**
 * Formatting utilities for the Online PC Store storefront.
 */

/**
 * Format a number as Vietnamese Dong currency.
 *
 * @example
 * formatVND(1500000)  // "1.500.000 ₫"
 * formatVND(0)        // "0 ₫"
 */
export function formatVND(amount: number): string {
  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });
}

/**
 * Calculate the discount percentage between original and current price.
 * Returns 0 when originalPrice is 0 or undefined.
 *
 * @example
 * discountPercent(1200000, 1500000)  // 20
 */
export function discountPercent(
  currentPrice: number,
  originalPrice: number
): number {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Format an ISO timestamp as a Vietnamese relative-time string.
 *
 * @example
 * formatRelativeVi("2026-05-17T09:59:30Z", new Date("2026-05-17T10:00:00Z"))  // "30 giây trước"
 * formatRelativeVi("2026-05-17T09:55:00Z", new Date("2026-05-17T10:00:00Z"))  // "5 phút trước"
 */
export function formatRelativeVi(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (diff < 60) return "Vừa xong";
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
