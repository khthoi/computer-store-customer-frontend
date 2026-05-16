"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowTopRightOnSquareIcon,
  TicketIcon,
  BoltIcon,
  GiftIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { Drawer } from "@/src/components/ui/Drawer";
import { Badge } from "@/src/components/ui/Badge";
import { Spinner } from "@/src/components/ui/Spinner";
import { Alert } from "@/src/components/ui/Alert";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import {
  getMyBuildDetail,
  type MySavedBuildDetail,
  type MySavedBuildItem,
  type MySavedBuildSummary,
  type AppliedPromotion,
} from "@/src/services/account-buildpc.service";

interface MyBuildDetailDrawerProps {
  build: MySavedBuildSummary | null;
  onClose: () => void;
  /** Override the data loader. Defaults to getMyBuildDetail (owner-scoped). */
  loader?: (id: number) => Promise<MySavedBuildDetail>;
  /** Slot rendered under the build header info — used by community drawer for author + stats. */
  extraHeader?: (detail: MySavedBuildDetail) => React.ReactNode;
  /** Footer action row inside the drawer — used by community drawer for the Clone CTA. */
  footerActions?: (detail: MySavedBuildDetail) => React.ReactNode;
  /** Title override; falls back to build.tenBuild. */
  title?: string;
}

// ── Discount helpers ──────────────────────────────────────────────────────────

/** VND saved by one promotion for a given line (unit price × qty). */
function promoLineSaving(
  p: AppliedPromotion,
  giaHienHanh: number,
  soLuong: number,
): number {
  if (p.discountType === "percentage" && p.discountValue != null) {
    return Math.floor((giaHienHanh * p.discountValue) / 100) * soLuong;
  }
  if (p.discountType === "fixed" && p.discountValue != null) {
    // Fixed = flat reduction per scope-match (not multiplied by qty)
    return p.discountValue;
  }
  return 0;
}

/** Final line total after flash-sale price + all promotion discounts. */
function computeLineTotal(item: MySavedBuildItem): number {
  const afterFlash = item.giaHienHanh * item.soLuong;
  const promoCut = item.appliedPromotions.reduce(
    (s, p) => s + promoLineSaving(p, item.giaHienHanh, item.soLuong),
    0,
  );
  return Math.max(0, afterFlash - promoCut);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ItemPricingBreakdown({ item }: { item: MySavedBuildItem }) {
  const flashSaving = item.flashSale
    ? (item.giaBan - item.giaHienHanh) * item.soLuong
    : 0;
  const hasFlash = flashSaving > 0;
  const hasPromos = item.appliedPromotions.length > 0;
  const hasStoreDiscount = item.giaGoc > 0 && item.giaGoc > item.giaBan;
  const lineTotal = computeLineTotal(item);
  const hasAnyDiscount = hasFlash || hasPromos;

  return (
    <div className="mt-2 rounded-lg border border-secondary-100 bg-secondary-50/80 px-3 py-2 space-y-1">
      {/* Giá gốc — shown only when store already discounted from giaGoc */}
      {hasStoreDiscount && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-secondary-400">
            Giá gốc{item.soLuong > 1 ? ` × ${item.soLuong}` : ""}
          </span>
          <span className="text-secondary-400 line-through">
            {formatVND(item.giaGoc * item.soLuong)}
          </span>
        </div>
      )}

      {/* Giá bán row (giaBan) */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary-500">
          Giá bán{item.soLuong > 1 ? ` × ${item.soLuong}` : ""}
        </span>
        <span
          className={
            hasAnyDiscount
              ? "text-secondary-400 line-through"
              : "font-medium text-secondary-700"
          }
        >
          {formatVND(item.giaBan * item.soLuong)}
        </span>
      </div>

      {/* Flash sale row */}
      {hasFlash && item.flashSale && (
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="flex items-start gap-1 text-error-600">
            <BoltIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-medium">Flash Sale</span>{" "}
              <span className="italic">&ldquo;{item.flashSale.ten}&rdquo;</span>
              <span className="ml-1 text-[10px] text-error-400">
                (hết{" "}
                {new Date(item.flashSale.ketThuc).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })}
                )
              </span>
            </span>
          </span>
          <span className="shrink-0 font-medium text-error-600">
            − {formatVND(flashSaving)}
          </span>
        </div>
      )}

      {/* Per-promotion rows */}
      {item.appliedPromotions.map((p) => {
        const saving = promoLineSaving(p, item.giaHienHanh, item.soLuong);
        return (
          <div
            key={p.id}
            className="flex items-start justify-between gap-2 text-xs"
          >
            <span className="flex items-start gap-1 text-success-700">
              <GiftIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-medium">&ldquo;{p.name}&rdquo;</span>
                {p.discountLabel && (
                  <span className="ml-1 text-[10px] text-success-500">
                    ({p.discountLabel}
                    {p.discountType === "percentage" && item.soLuong > 1
                      ? ` × ${item.soLuong}`
                      : ""}
                    )
                  </span>
                )}
              </span>
            </span>
            {saving > 0 ? (
              <span className="shrink-0 font-medium text-success-700">
                − {formatVND(saving)}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-secondary-400">—</span>
            )}
          </div>
        );
      })}

      {/* Divider + final line total */}
      {hasAnyDiscount && (
        <>
          <div className="border-t border-secondary-200 pt-1" />
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-secondary-700">Thành tiền</span>
            <span className="text-secondary-900">{formatVND(lineTotal)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function BuildSummaryPanel({ detail }: { detail: MySavedBuildDetail }) {
  const items = detail.chiTiet;
  if (items.length === 0) return null;

  // Reference price per item: prefer giaGoc when set higher than giaBan, otherwise giaBan
  const refPrice = (it: MySavedBuildItem) =>
    it.giaGoc > 0 && it.giaGoc > it.giaBan ? it.giaGoc : it.giaBan;
  const originalTotal = items.reduce(
    (s, it) => s + refPrice(it) * it.soLuong,
    0,
  );
  const storeSavings = items.reduce(
    (s, it) =>
      s +
      (it.giaGoc > 0 && it.giaGoc > it.giaBan
        ? (it.giaGoc - it.giaBan) * it.soLuong
        : 0),
    0,
  );
  const flashSavings = items.reduce(
    (s, it) =>
      s + (it.flashSale ? (it.giaBan - it.giaHienHanh) * it.soLuong : 0),
    0,
  );

  // Aggregate promotion savings by promotion id
  const promoMap = new Map<
    number,
    { id: number; name: string; discountLabel: string | null; saving: number }
  >();
  for (const it of items) {
    for (const p of it.appliedPromotions) {
      const s = promoLineSaving(p, it.giaHienHanh, it.soLuong);
      const existing = promoMap.get(p.id) ?? {
        id: p.id,
        name: p.name,
        discountLabel: p.discountLabel,
        saving: 0,
      };
      existing.saving += s;
      promoMap.set(p.id, existing);
    }
  }
  const promoList = Array.from(promoMap.values()).filter((x) => x.saving > 0);
  const totalPromoSavings = promoList.reduce((s, x) => s + x.saving, 0);
  const finalTotal =
    originalTotal - storeSavings - flashSavings - totalPromoSavings;
  const totalSavings = storeSavings + flashSavings + totalPromoSavings;
  const hasAnyDiscount = totalSavings > 0;

  return (
    <div className="rounded-xl border border-secondary-200 bg-secondary-50 px-4 py-3 space-y-1.5">
      {hasAnyDiscount && (
        <>
          {/* Original total (giá gốc reference) */}
          <div className="flex justify-between text-xs text-secondary-500">
            <span>Tổng giá gốc</span>
            <span className="line-through">{formatVND(originalTotal)}</span>
          </div>

          {/* Store discount savings (giá gốc → giá bán) */}
          {storeSavings > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary-600">Giảm giá cửa hàng</span>
              <span className="font-medium text-secondary-600">
                − {formatVND(storeSavings)}
              </span>
            </div>
          )}

          {/* Flash sale savings */}
          {flashSavings > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-error-600">
                <BoltIcon className="h-3.5 w-3.5" />
                Tiết kiệm Flash Sale
              </span>
              <span className="font-medium text-error-600">
                − {formatVND(flashSavings)}
              </span>
            </div>
          )}

          {/* Per-promotion savings */}
          {promoList.map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-2 text-xs">
              <span className="flex items-start gap-1 text-success-700">
                <GiftIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Khuyến mãi{" "}
                  <span className="font-medium">&ldquo;{p.name}&rdquo;</span>
                  {p.discountLabel && (
                    <span className="text-[10px] text-success-500">
                      {" "}({p.discountLabel})
                    </span>
                  )}
                </span>
              </span>
              <span className="shrink-0 font-medium text-success-700">
                − {formatVND(p.saving)}
              </span>
            </div>
          ))}

          <div className="border-t border-secondary-200" />
        </>
      )}

      {/* Final total */}
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-secondary-800">
          {hasAnyDiscount ? "Tổng sau ưu đãi" : "Tổng cộng"}
        </span>
        <span className="font-bold text-secondary-900">
          {formatVND(finalTotal)}
        </span>
      </div>

      {/* Total savings callout */}
      {hasAnyDiscount && (
        <div className="flex items-center justify-end gap-1 text-[11px] font-medium text-success-600">
          <TagIcon className="h-3.5 w-3.5" />
          Tiết kiệm tổng cộng: {formatVND(totalSavings)}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MyBuildDetailDrawer({
  build,
  onClose,
  loader,
  extraHeader,
  footerActions,
  title,
}: MyBuildDetailDrawerProps) {
  const [detail, setDetail] = useState<MySavedBuildDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!build) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    const load = loader ?? getMyBuildDetail;
    load(build.id)
      .then(setDetail)
      .catch(() => setError("Không thể tải chi tiết cấu hình."))
      .finally(() => setLoading(false));
    // loader intentionally not in deps — caller controls when to swap loader
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build]);

  return (
    <Drawer
      isOpen={build !== null}
      onClose={onClose}
      position="right"
      size="2xl"
      title={title ?? build?.tenBuild ?? "Chi tiết cấu hình"}
    >
      {!build ? null : loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <div className="space-y-6">
          {/* ── Header info ── */}
          <div className="space-y-3 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-secondary-800">{build.tenBuild}</p>
                {build.moTa && (
                  <p className="mt-0.5 text-sm text-secondary-500">{build.moTa}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {build.isPublic && (
                  <Badge variant="primary" size="sm">Công khai</Badge>
                )}
                <Badge
                  variant={build.trangThai === "complete" ? "success" : "default"}
                  size="sm"
                >
                  {build.trangThai === "complete" ? "Hoàn chỉnh" : "Nháp"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-secondary-500">
              <span>
                Số linh kiện:{" "}
                <strong className="text-secondary-700">{build.itemCount}</strong>
              </span>
            </div>

            <div className="text-xs text-secondary-400">
              Tạo lúc {new Date(build.ngayTao).toLocaleString("vi-VN")} ·{" "}
              Cập nhật {new Date(build.ngayCapNhat).toLocaleString("vi-VN")}
            </div>
          </div>

          {/* ── Extra header slot (community mode: author + stats) ── */}
          {detail && extraHeader && extraHeader(detail)}

          {/* ── Line items ── */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-500">
              Sản phẩm ({detail?.chiTiet.length ?? 0})
            </h4>

            {detail && detail.chiTiet.length === 0 ? (
              <p className="text-sm text-secondary-400">
                Chưa có linh kiện nào trong cấu hình này.
              </p>
            ) : (
              <div className="space-y-3">
                {detail?.chiTiet.map((item) => {
                  const hasStoreDiscount =
                    item.giaGoc > 0 && item.giaGoc > item.giaBan;
                  const hasDiscount =
                    !!item.flashSale ||
                    item.appliedPromotions.length > 0 ||
                    hasStoreDiscount;
                  const lineTotal = computeLineTotal(item);

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-secondary-200 bg-white p-3"
                    >
                      {/* Top row: thumbnail + info + price */}
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-secondary-200 bg-secondary-50 flex items-center justify-center">
                          {item.hinhAnh ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.hinhAnh}
                              alt={item.tenPhienBan}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-secondary-300 uppercase">
                              {item.slotTen.slice(0, 3)}
                            </span>
                          )}
                        </div>

                        {/* Product info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Tooltip
                                content={
                                  <div className="space-y-1">
                                    <p className="font-semibold leading-snug">
                                      {item.tenSanPham}
                                    </p>
                                    <p className="text-[11px] text-secondary-300">
                                      Danh mục: {item.danhMucTen || "—"}
                                    </p>
                                  </div>
                                }
                                placement="top"
                              >
                                <Link
                                  href={
                                    item.sanPhamSlug
                                      ? `/products/${item.sanPhamSlug}`
                                      : "#"
                                  }
                                  className="group inline-flex items-center gap-1 text-sm font-semibold text-secondary-800 hover:text-primary-600 transition-colors"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <span className="truncate max-w-[220px]">
                                    {item.tenSanPham}
                                  </span>
                                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                              </Tooltip>
                              <Tooltip
                                content={
                                  <div className="space-y-1">
                                    <p className="font-semibold leading-snug">
                                      {item.tenPhienBan}
                                    </p>
                                    <p className="text-[11px] font-mono text-secondary-300">
                                      {item.SKU}
                                    </p>
                                    <p className="text-[11px] text-secondary-300">
                                      {formatVND(item.giaBan)}
                                    </p>
                                  </div>
                                }
                                placement="top"
                              >
                                <span className="block truncate max-w-[220px] text-[12px] text-secondary-500 hover:text-primary-600 transition-colors cursor-help">
                                  {item.tenPhienBan}
                                </span>
                              </Tooltip>
                              <p className="text-[11px] font-mono text-secondary-400">
                                {item.SKU}
                              </p>
                            </div>

                            {/* Right-side: line total */}
                            <div className="shrink-0 text-right">
                              {/* Giá gốc — topmost reference when store discount exists */}
                              {hasStoreDiscount && (
                                <p className="text-[11px] text-secondary-300 line-through whitespace-nowrap">
                                  {formatVND(item.giaGoc * item.soLuong)}
                                </p>
                              )}
                              {/* Giá bán — strikethrough when further discounted by flash/promo */}
                              {(!!item.flashSale || item.appliedPromotions.length > 0) && (
                                <p className="text-[11px] text-secondary-400 line-through whitespace-nowrap">
                                  {formatVND(item.giaBan * item.soLuong)}
                                </p>
                              )}
                              {/* Final effective price */}
                              <p
                                className={`text-sm font-bold whitespace-nowrap ${
                                  hasDiscount
                                    ? "text-primary-700"
                                    : "text-secondary-800"
                                }`}
                              >
                                {formatVND(lineTotal)}
                              </p>
                            </div>
                          </div>

                          {/* Badges row */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge variant="default" size="sm">
                              {item.slotTen}
                            </Badge>
                            {item.danhMucTen && (
                              <Badge variant="info" size="sm">
                                {item.danhMucTen}
                              </Badge>
                            )}
                            {item.brands.map((b) => (
                              <Badge key={b.id} variant="primary" size="sm">
                                {b.ten}
                              </Badge>
                            ))}
                            {item.soLuong > 1 && (
                              <span className="text-[11px] text-secondary-400">
                                {formatVND(item.giaHienHanh)} × {item.soLuong}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Pricing breakdown (only when discounts exist) */}
                      {hasDiscount && <ItemPricingBreakdown item={item} />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Applicable coupons ── */}
          {detail && detail.applicableCoupons.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-secondary-500">
                <TicketIcon className="h-4 w-4" />
                Mã giảm giá có thể áp dụng ({detail.applicableCoupons.length})
              </h4>
              <div className="space-y-2">
                {detail.applicableCoupons.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-xl border border-dashed border-primary-300 bg-primary-50 p-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
                      <TicketIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="rounded-md border border-primary-300 bg-white px-2 py-0.5 text-xs font-bold tracking-wider text-primary-700">
                          {c.code}
                        </code>
                        <Badge variant="primary" size="sm">
                          {c.discountLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-secondary-800">
                        {c.name}
                      </p>
                      {c.description && (
                        <p className="mt-0.5 text-xs text-secondary-500">
                          {c.description}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-secondary-400">
                        Hết hạn{" "}
                        {new Date(c.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Summary ── */}
          {detail && <BuildSummaryPanel detail={detail} />}

          {/* ── Footer actions slot (community mode: Clone CTA) ── */}
          {detail && footerActions && (
            <div className="border-t border-secondary-200 pt-4">
              {footerActions(detail)}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
