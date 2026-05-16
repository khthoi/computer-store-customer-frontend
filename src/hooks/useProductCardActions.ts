"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/store/auth.store";
import { useCompare } from "@/src/store/compare.store";
import { useWishlist } from "@/src/store/wishlist.store";
import { useToast } from "@/src/components/ui/Toast";
import { addCartItem } from "@/src/services/cart.service";
import { getCompareVariantById } from "@/src/services/compare.service";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

function readVariantId(selected: Record<string, string>): number | null {
  const raw = selected.variantId ?? Object.values(selected)[0];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Thao tác không thành công, vui lòng thử lại";
}

export function useProductCardActions() {
  const router = useRouter();
  const pathname = usePathname();
  const { state: authState } = useAuth();
  const compare = useCompare();
  const wishlist = useWishlist();
  const { showToast } = useToast();

  const isAuthed = authState.status === "authenticated";

  const requireAuth = useCallback(
    (next: string): boolean => {
      if (isAuthed) return true;
      router.push(`/login?redirect=${encodeURIComponent(next || pathname || "/")}`);
      return false;
    },
    [isAuthed, router, pathname],
  );

  const handleAddToCart = useCallback(
    async (_productId: string, selected: Record<string, string>, quantity = 1) => {
      if (!requireAuth("/cart")) return;
      const variantId = readVariantId(selected);
      if (!variantId) {
        showToast("Vui lòng chọn phiên bản sản phẩm", "error");
        return;
      }
      const qty = Math.max(1, Math.floor(quantity));
      try {
        await addCartItem(variantId, qty);
        showToast(qty > 1 ? `Đã thêm ${qty} sản phẩm vào giỏ hàng` : "Đã thêm vào giỏ hàng", "success");
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      }
    },
    [requireAuth, showToast],
  );

  const handleWishlistToggle = useCallback(
    async (_productId: string, wishlisted: boolean, selected: Record<string, string>) => {
      if (!requireAuth("/account/wishlist")) return;
      const variantId = readVariantId(selected);
      if (!variantId) {
        showToast("Vui lòng chọn phiên bản sản phẩm", "error");
        return;
      }
      const alreadyExists = wishlist.state.items.some(
        (i) => i.variantId === variantId,
      );
      try {
        if (wishlisted) {
          if (alreadyExists) {
            showToast(
              "Phiên bản này đã có trong danh sách yêu thích",
              "info",
            );
            return;
          }
          await wishlist.addItem(variantId);
          showToast("Đã thêm vào danh sách yêu thích", "success");
        } else {
          if (!alreadyExists) {
            showToast(
              "Phiên bản này không có trong danh sách yêu thích",
              "info",
            );
            return;
          }
          await wishlist.removeItem(variantId);
          showToast("Đã bỏ khỏi danh sách yêu thích", "success");
        }
      } catch (err) {
        showToast(getErrorMessage(err), "error");
      }
    },
    [requireAuth, showToast, wishlist],
  );

  const makeCompareHandler = useCallback(
    (dto: StorefrontProductCardDto) => {
      return async (_productId: string, selected: Record<string, string>) => {
        const variantId = readVariantId(selected);
        if (!variantId) {
          showToast("Vui lòng chọn phiên bản sản phẩm", "error");
          return;
        }
        const slug = dto.slug && dto.slug.length > 0 ? dto.slug : null;
        if (!slug) {
          showToast(
            "Sản phẩm chưa có dữ liệu so sánh đầy đủ, vui lòng thử lại sau",
            "error",
          );
          return;
        }
        try {
          const compareProduct = await getCompareVariantById({
            productSlug: slug,
            variantId: String(variantId),
          });
          if (!compareProduct) {
            showToast(
              "Không tải được dữ liệu so sánh cho sản phẩm này",
              "error",
            );
            return;
          }
          const first = compare.state.compareList[0];
          const sameKind = !first
            || (first.rootCategoryId && compareProduct.rootCategoryId
                  ? first.rootCategoryId === compareProduct.rootCategoryId
                  : first.categoryId === compareProduct.categoryId);
          if (!sameKind) {
            const ok =
              typeof window !== "undefined" &&
              window.confirm(
                `Danh sách so sánh hiện có sản phẩm "${first.name}" thuộc danh mục khác. Bạn có muốn thay thế bằng sản phẩm mới không?`,
              );
            if (!ok) return;
            compare.replaceWith(compareProduct);
            return;
          }
          compare.addProduct(compareProduct);
        } catch (err) {
          showToast(getErrorMessage(err), "error");
        }
      };
    },
    [compare, showToast],
  );

  return { handleAddToCart, handleWishlistToggle, makeCompareHandler };
}
