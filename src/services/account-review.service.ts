import { apiFetch } from "@/src/services/api";
import type { ProductReview } from "@/src/types/account-order.types";

interface RawReviewResponse {
  reviewId: number;
  phienBanId: number;
  khachHangId: number;
  donHangId: number;
  rating: number;
  tieuDe: string | null;
  noiDung: string | null;
  hinhAnh?: string[];
  trangThai: string;
  createdAt: string;
}

function mapStatus(s: string): ProductReview["status"] {
  if (s === "Approved") return "approved";
  return "pending";
}

export interface SubmitProductReviewInput {
  /** OrderDetailItem.id — used to key the response back to the originating card. */
  itemId: string;
  orderId: number;
  variantId: number;
  rating: number;
  title?: string;
  content: string;
  /** Optional image files (max 5, ≤5MB each — enforced by backend). */
  images?: File[];
}

/**
 * Submit a product review for a delivered order item.
 *
 * Uses multipart/form-data so attached image files are forwarded to the
 * backend, which uploads them to Cloudinary and returns the resulting URLs.
 * `apiFetch` automatically omits the JSON Content-Type when the body is a
 * FormData instance, so the browser sets the correct multipart boundary.
 */
export async function submitProductReview(
  input: SubmitProductReviewInput,
): Promise<ProductReview> {
  const form = new FormData();
  form.append("orderId", String(input.orderId));
  form.append("variantId", String(input.variantId));
  form.append("rating", String(input.rating));
  if (input.title && input.title.trim()) form.append("title", input.title.trim());
  form.append("content", input.content);
  if (input.images) {
    for (const f of input.images) {
      form.append("images", f, f.name);
    }
  }

  const raw = await apiFetch<RawReviewResponse>("/reviews", {
    method: "POST",
    body: form,
  });

  return {
    itemId: input.itemId,
    rating: raw.rating,
    title: raw.tieuDe ?? undefined,
    comment: raw.noiDung ?? input.content,
    reviewedAt: raw.createdAt,
    status: mapStatus(raw.trangThai),
    images: raw.hinhAnh ?? [],
  };
}
