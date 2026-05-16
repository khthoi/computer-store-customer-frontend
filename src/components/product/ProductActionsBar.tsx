"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowsRightLeftIcon,
  HeartIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useToast } from "@/src/components/ui/Toast";
import { useAuth } from "@/src/store/auth.store";
import { useWishlist } from "@/src/store/wishlist.store";
import { useCompare } from "@/src/store/compare.store";
import { getCompareVariantById } from "@/src/services/compare.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductActionsBarProps {
  productId: string;
  productName: string;
  /** Product slug — used to fetch CompareProduct on add */
  productSlug: string;
  /** Currently selected variant id (null while resolving / no variant chosen) */
  variantId: number | null;
}

// ─── Tooltip helper ───────────────────────────────────────────────────────────

function ActionTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-secondary-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-20">
      {label}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ProductActionsBar — unified Wishlist / Compare / Share strip.
 *
 * - **Wishlist**: persistent via WishlistContext (variant-scoped). Toggle adds
 *   or removes the *currently selected* variant. Requires authentication.
 * - **Compare**: persistent via CompareContext (variant-scoped, localStorage).
 *   On add, fetches the rich CompareProduct (specs + category) so the
 *   `/compare` page can render rows correctly. Toggle removes when already in.
 * - **Share**: copies current URL to clipboard with momentary "copied" state.
 */
export function ProductActionsBar({
  productId: _productId,
  productName,
  productSlug,
  variantId,
}: ProductActionsBarProps) {
  const { showToast } = useToast();
  const { state: authState, openModal: openAuthModal } = useAuth();
  const isLoggedIn = authState.status === "authenticated";

  const { hasVariant, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();
  const {
    state: compareState,
    addProduct: addCompare,
    removeProduct: removeCompare,
  } = useCompare();

  // Derived states — reflect current store
  const isWishlisted = variantId != null && hasVariant(variantId);
  const isCompared =
    variantId != null && compareState.compareList.some((p) => p.id === String(variantId));

  const [wishlistBusy, setWishlistBusy] = useState(false);
  const [compareBusy, setCompareBusy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  // ── Wishlist ──────────────────────────────────────────────────────────────

  const handleWishlist = useCallback(async () => {
    if (wishlistBusy) return;
    if (variantId == null) {
      showToast("Vui lòng chọn phiên bản sản phẩm.", "error");
      return;
    }
    if (!isLoggedIn) {
      openAuthModal("login", `/products/${productSlug}`);
      showToast("Vui lòng đăng nhập để dùng danh sách yêu thích.", "info");
      return;
    }
    setWishlistBusy(true);
    try {
      if (isWishlisted) {
        await removeWishlist(variantId);
        showToast("Đã bỏ khỏi danh sách yêu thích", "info");
      } else {
        await addWishlist(variantId);
        showToast("Đã thêm vào danh sách yêu thích", "success");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể cập nhật danh sách yêu thích.";
      showToast(message, "error");
    } finally {
      setWishlistBusy(false);
    }
  }, [
    wishlistBusy,
    variantId,
    isLoggedIn,
    isWishlisted,
    addWishlist,
    removeWishlist,
    openAuthModal,
    productSlug,
    showToast,
  ]);

  // ── Compare ───────────────────────────────────────────────────────────────

  const handleCompare = useCallback(async () => {
    if (compareBusy) return;
    if (variantId == null) {
      showToast("Vui lòng chọn phiên bản sản phẩm.", "error");
      return;
    }
    const id = String(variantId);
    if (isCompared) {
      removeCompare(id);
      showToast("Đã bỏ khỏi danh sách so sánh", "info");
      return;
    }
    setCompareBusy(true);
    try {
      const compareProduct = await getCompareVariantById({
        productSlug,
        variantId: id,
      });
      if (!compareProduct) {
        showToast("Sản phẩm này hiện chưa hỗ trợ so sánh.", "error");
        return;
      }
      addCompare(compareProduct);
      // Note: CompareProvider shows its own toast on add/limit hit.
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể thêm vào danh sách so sánh.";
      showToast(message, "error");
    } finally {
      setCompareBusy(false);
    }
  }, [
    compareBusy,
    variantId,
    isCompared,
    addCompare,
    removeCompare,
    productSlug,
    showToast,
  ]);

  // ── Share ─────────────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (isCopied) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // clipboard write failed silently
    }
  }, [isCopied]);

  // Reference so unused-vars lint stays quiet
  void productName;

  return (
    <div className="flex items-center gap-1">

      {/* ── Wishlist ── */}
      <div className="group relative">
        <button
          type="button"
          aria-label="Thêm vào danh sách yêu thích"
          aria-pressed={isWishlisted}
          disabled={wishlistBusy}
          onClick={handleWishlist}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
            isWishlisted
              ? "text-error-500 hover:bg-error-50"
              : "text-secondary-600 hover:bg-secondary-100 hover:text-error-500",
          ].join(" ")}
        >
          <motion.span
            animate={isWishlisted ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            {isWishlisted ? (
              <HeartSolidIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <HeartIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </motion.span>
          Yêu thích
        </button>
        <ActionTooltip label={isWishlisted ? "Đã yêu thích" : "Thêm yêu thích"} />
      </div>

      {/* ── Compare ── */}
      <div className="group relative">
        <button
          type="button"
          aria-label="So sánh sản phẩm"
          aria-pressed={isCompared}
          disabled={compareBusy}
          onClick={handleCompare}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60",
            isCompared
              ? "bg-primary-50 text-primary-600 hover:bg-primary-100"
              : "text-secondary-600 hover:bg-secondary-100 hover:text-primary-600",
          ].join(" ")}
        >
          <motion.span
            animate={isCompared ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <ArrowsRightLeftIcon className="h-5 w-5" aria-hidden="true" />
          </motion.span>
          So sánh
        </button>
        <ActionTooltip label={isCompared ? "Đang so sánh" : "Thêm vào so sánh"} />
      </div>

      {/* ── Share ── */}
      <div className="group relative">
        <button
          type="button"
          aria-label="Chia sẻ sản phẩm"
          onClick={handleShare}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isCopied
              ? "bg-success-50 text-success-600 hover:bg-success-100"
              : "text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900",
          ].join(" ")}
        >
          <motion.span
            animate={isCopied ? { scale: [1, 1.3, 1] } : { scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
          >
            <ShareIcon className="h-5 w-5" aria-hidden="true" />
          </motion.span>
          Chia sẻ
        </button>
        <ActionTooltip label={isCopied ? "Đã sao chép!" : "Sao chép liên kết"} />
      </div>

    </div>
  );
}
