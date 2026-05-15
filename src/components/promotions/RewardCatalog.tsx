"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GiftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { useAuth } from "@/src/store/auth.store";
import { useToast } from "@/src/components/ui/Toast";
import { getMyPoints, redeemReward } from "@/src/services/loyalty.service";
import type { LoyaltyReward } from "@/src/types/loyalty.types";

export interface RewardCatalogProps {
  rewards: LoyaltyReward[];
}

function formatNumber(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "0";
  return n.toLocaleString("vi-VN");
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function RewardCatalog({ rewards }: RewardCatalogProps) {
  const { state: authState, openModal } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [balance, setBalance] = useState<number | null>(null);
  const [pendingReward, setPendingReward] = useState<LoyaltyReward | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoggedIn = !!authState.user;

  useEffect(() => {
    if (!isLoggedIn) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const value = await getMyPoints();
        if (!cancelled) setBalance(value);
      } catch {
        if (!cancelled) setBalance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  if (rewards.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-secondary-200 bg-secondary-50 px-4 py-12 text-center text-sm text-secondary-500">
        Hiện chưa có phần thưởng nào để đổi điểm.
      </p>
    );
  }

  const handleRedeemClick = (reward: LoyaltyReward) => {
    if (!isLoggedIn) {
      openModal("login", "/promotions/rewards");
      return;
    }
    setPendingReward(reward);
  };

  const handleConfirm = async () => {
    if (!pendingReward) return;
    setIsSubmitting(true);
    try {
      const redemption = await redeemReward(Number(pendingReward.id));
      showToast(
        `Đổi điểm thành công! Mã coupon: ${redemption.couponCode}`,
        "success",
        5000,
      );
      try {
        const value = await getMyPoints();
        setBalance(value);
      } catch {
        // ignore — balance is informational
      }
      setPendingReward(null);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đổi điểm thất bại.";
      showToast(message, "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="mt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <SparklesIcon className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <span className="text-secondary-700">
              {isLoggedIn ? (
                <>
                  Số điểm hiện có:{" "}
                  <strong className="text-primary-700">
                    {balance != null ? `${formatNumber(balance)} điểm` : "Đang tải…"}
                  </strong>
                </>
              ) : (
                "Đăng nhập để xem số điểm tích lũy của bạn."
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rewards.map((reward) => {
            const remaining =
              reward.stockLimit != null
                ? Math.max(0, reward.stockLimit - (reward.redeemed ?? 0))
                : null;
            const soldOut = remaining === 0;
            const notEnough =
              isLoggedIn && balance != null && balance < reward.pointsRequired;
            const validFrom = formatDate(reward.validFrom);
            const validTo = formatDate(reward.validUntil);

            return (
              <article
                key={reward.id}
                className="flex h-full flex-col rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600">
                    <GiftIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold leading-tight text-secondary-900">
                      {reward.name}
                    </h3>
                    {reward.description ? (
                      <p className="mt-1 text-sm text-secondary-500">
                        {reward.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold text-primary-700">
                  {formatNumber(reward.pointsRequired)}{" "}
                  <span className="text-sm font-medium text-secondary-500">điểm</span>
                </p>

                <ul className="mt-3 space-y-1 text-xs text-secondary-500">
                  <li>
                    Số lượng còn lại:{" "}
                    {remaining == null
                      ? "Không giới hạn"
                      : `${formatNumber(remaining)}`}
                  </li>
                  {validFrom || validTo ? (
                    <li>
                      Hiệu lực: {validFrom ?? "Không giới hạn"} – {validTo ?? "Không giới hạn"}
                    </li>
                  ) : null}
                </ul>

                <button
                  type="button"
                  onClick={() => handleRedeemClick(reward)}
                  disabled={soldOut || notEnough}
                  className={[
                    "mt-4 inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors",
                    soldOut || notEnough
                      ? "cursor-not-allowed bg-secondary-100 text-secondary-400"
                      : "bg-primary-600 text-white hover:bg-primary-700",
                  ].join(" ")}
                >
                  {soldOut
                    ? "Đã hết phần thưởng"
                    : notEnough
                      ? "Chưa đủ điểm"
                      : "Đổi ngay"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <Modal
        isOpen={pendingReward !== null}
        onClose={() => (isSubmitting ? null : setPendingReward(null))}
        title="Xác nhận đổi điểm"
        size="md"
        animated
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPendingReward(null)}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-secondary-200 px-4 text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {isSubmitting ? "Đang xử lý…" : "Xác nhận đổi"}
            </button>
          </div>
        }
      >
        {pendingReward ? (
          <div className="space-y-3 text-sm text-secondary-700">
            <p>
              Bạn sẽ dùng{" "}
              <strong className="text-primary-700">
                {formatNumber(pendingReward.pointsRequired)} điểm
              </strong>{" "}
              để đổi phần thưởng:
            </p>
            <p className="rounded-lg bg-secondary-50 px-3 py-2 font-medium text-secondary-900">
              {pendingReward.name}
            </p>
            {balance != null ? (
              <p className="text-xs text-secondary-500">
                Số điểm hiện tại: {formatNumber(balance)} điểm. Sau khi đổi còn{" "}
                {formatNumber(Math.max(0, balance - pendingReward.pointsRequired))}{" "}
                điểm.
              </p>
            ) : null}
            <p className="text-xs text-secondary-500">
              Sau khi đổi, bạn sẽ nhận được mã coupon để dùng ở bước thanh toán.
              Mã không thể quy đổi thành tiền mặt.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
