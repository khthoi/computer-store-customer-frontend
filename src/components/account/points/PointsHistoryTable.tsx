import { Badge } from "@/src/components/ui/Badge";
import type {
  PointTransaction,
  PointTransactionType,
} from "@/src/types/account-loyalty.types";
import type { BadgeVariant } from "@/src/components/ui/Badge";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<
  PointTransactionType,
  { label: string; variant: BadgeVariant }
> = {
  earn:   { label: "Tích điểm",    variant: "success" },
  redeem: { label: "Đổi điểm",    variant: "primary" },
  expire: { label: "Hết hạn",     variant: "error" },
  adjust: { label: "Điều chỉnh",  variant: "warning" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PointsHistoryTableProps {
  transactions: PointTransaction[];
}

/**
 * PointsHistoryTable — responsive table of point transactions.
 * On mobile collapses to a card-list layout.
 */
export function PointsHistoryTable({ transactions }: PointsHistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-secondary-400">
        Chưa có lịch sử giao dịch điểm.
      </p>
    );
  }

  return (
    <>
      {/* ── Desktop table ── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-secondary-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-secondary-200 bg-secondary-50 text-left text-xs font-semibold uppercase tracking-wider text-secondary-400">
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3 text-right">Điểm</th>
              <th className="px-4 py-3 text-right">Số dư sau</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {transactions.map((tx) => {
              const meta = TYPE_META[tx.type];
              const isPositive = tx.points > 0;
              return (
                <tr key={tx.id} className="bg-white hover:bg-secondary-50 transition-colors">
                  <td className="px-4 py-3 text-secondary-500 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-secondary-800">{tx.description}</td>
                  <td className="px-4 py-3">
                    <Badge variant={meta.variant} size="sm">
                      {meta.label}
                    </Badge>
                  </td>
                  <td
                    className={[
                      "px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap",
                      isPositive ? "text-success-600" : "text-error-600",
                    ].join(" ")}
                  >
                    {isPositive ? "+" : ""}
                    {tx.points.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-right text-secondary-600 tabular-nums whitespace-nowrap">
                    {tx.balanceAfter.toLocaleString("vi-VN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => {
          const meta = TYPE_META[tx.type];
          const isPositive = tx.points > 0;
          return (
            <div
              key={tx.id}
              className="rounded-xl border border-secondary-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-secondary-800 leading-snug">
                    {tx.description}
                  </p>
                  <p className="mt-1 text-xs text-secondary-400">
                    {formatDate(tx.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={[
                      "text-sm font-bold tabular-nums",
                      isPositive ? "text-success-600" : "text-error-600",
                    ].join(" ")}
                  >
                    {isPositive ? "+" : ""}
                    {tx.points.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary-400 tabular-nums">
                    Số dư: {tx.balanceAfter.toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant={meta.variant} size="sm">
                  {meta.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
