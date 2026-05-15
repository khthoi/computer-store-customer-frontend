import type {
  Promotion,
  PromotionAction,
  PromotionCondition,
  PromotionScope,
  BulkTier,
} from "@/src/types/promotion.types";
import { formatVND } from "@/src/lib/format";

export interface PromotionExplanation {
  title: string;
  mechanismLines: string[];
  example: string;
  validityLine: string;
  scopeLine: string;
  usageLine: string | null;
  isCoupon: boolean;
  couponCode: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function applicationLevelText(level: PromotionAction["applicationLevel"]): string {
  switch (level) {
    case "cart_total":
      return "tổng đơn hàng";
    case "per_item":
      return "mỗi sản phẩm áp dụng";
    case "cheapest_item":
      return "sản phẩm có giá thấp nhất";
    default:
      return "đơn hàng";
  }
}

function describeAction(action: PromotionAction): string[] {
  const lines: string[] = [];
  const target = applicationLevelText(action.applicationLevel);

  switch (action.actionType) {
    case "percentage_discount": {
      const value = toNumber(action.discountValue);
      lines.push(`Giảm ${value}% trên ${target}.`);
      if (action.maxDiscountAmount != null) {
        lines.push(`Số tiền giảm tối đa: ${formatVND(toNumber(action.maxDiscountAmount))}.`);
      }
      break;
    }
    case "fixed_discount_item":
    case "fixed_discount_cart": {
      const value = toNumber(action.discountValue);
      lines.push(`Giảm ${formatVND(value)} trên ${target}.`);
      break;
    }
    case "free_item":
      lines.push("Tặng kèm sản phẩm miễn phí khi đủ điều kiện.");
      break;
    case "bxgy": {
      const buyQty = action.bxgyBuyQty ?? 1;
      const getQty = action.bxgyGetQty ?? 1;
      const pct = action.bxgyGetDiscountPct ?? 100;
      const freeText = pct === 100 ? "miễn phí" : `giảm ${pct}%`;
      lines.push(
        `Mua ${buyQty} sản phẩm, được thêm ${getQty} sản phẩm ${freeText}.`,
      );
      if (action.bxgyDeliveryMode === "auto_add") {
        lines.push("Hệ thống tự động thêm sản phẩm tặng vào giỏ.");
      } else if (action.bxgyDeliveryMode === "customer_selects") {
        lines.push("Khách hàng tự chọn sản phẩm tặng từ danh sách cho phép.");
      }
      if (action.bxgyMaxApplications != null) {
        lines.push(`Áp dụng tối đa ${action.bxgyMaxApplications} lần trên mỗi đơn.`);
      }
      break;
    }
    case "bundle_discount": {
      const value = toNumber(action.discountValue);
      const unit = action.discountType === "percentage" ? "%" : "";
      const components = action.bulkComponents ?? [];
      if (components.length > 0) {
        const parts = components
          .map((c) => `${c.minQuantity} × ${c.refLabel ?? `#${c.refId}`}`)
          .join(", ");
        lines.push(`Mua combo gồm: ${parts}.`);
      } else {
        lines.push("Mua đủ combo theo cấu hình.");
      }
      if (action.discountType === "percentage") {
        lines.push(`Giảm ${value}${unit} cho combo.`);
      } else {
        lines.push(`Giảm ${formatVND(value)} cho combo.`);
      }
      break;
    }
    case "bulk_discount": {
      const tiers = (action.bulkTiers ?? [])
        .slice()
        .sort((a, b) => a.minQuantity - b.minQuantity);
      if (tiers.length === 0) {
        lines.push("Càng mua nhiều, giảm càng sâu.");
        break;
      }
      lines.push("Mức giảm theo số lượng mua:");
      for (const tier of tiers) {
        lines.push(describeTier(tier));
      }
      break;
    }
    case "free_shipping":
      lines.push("Miễn phí vận chuyển khi đủ điều kiện áp dụng.");
      break;
    default:
      lines.push("Ưu đãi đặc biệt — xem chi tiết tại trang thanh toán.");
  }
  return lines;
}

function describeTier(tier: BulkTier): string {
  const max = tier.maxQuantity == null ? "trở lên" : `đến ${tier.maxQuantity}`;
  const range = tier.maxQuantity == null
    ? `Từ ${tier.minQuantity} sản phẩm ${max}`
    : `Mua ${tier.minQuantity}–${tier.maxQuantity} sản phẩm`;
  const value = toNumber(tier.discountValue);
  if (tier.discountType === "percentage") {
    return `• ${range}: giảm ${value}%`;
  }
  return `• ${range}: giảm ${formatVND(value)}`;
}

function describeCondition(c: PromotionCondition): string {
  switch (c.type) {
    case "min_order_value":
      return `Đơn hàng tối thiểu ${formatVND(toNumber(c.value))}.`;
    case "min_item_quantity":
      return `Mua tối thiểu ${c.value} sản phẩm.`;
    case "first_order_only":
      return "Chỉ áp dụng cho đơn hàng đầu tiên.";
    case "customer_group":
      return `Dành cho nhóm khách: ${c.value}.`;
    case "required_products":
      return "Giỏ hàng phải có sản phẩm yêu cầu.";
    case "required_categories":
      return "Giỏ hàng phải có sản phẩm thuộc danh mục yêu cầu.";
    case "payment_method":
      return `Thanh toán bằng: ${c.value}.`;
    case "platform":
      return `Áp dụng trên nền tảng: ${c.value}.`;
    default:
      return `Điều kiện áp dụng: ${c.type}.`;
  }
}

function describeScopes(scopes: PromotionScope[]): string {
  if (!scopes || scopes.length === 0) {
    return "Áp dụng cho tất cả sản phẩm.";
  }
  if (scopes.some((s) => s.scopeType === "global")) {
    return "Áp dụng cho toàn bộ sản phẩm.";
  }
  const buckets: Record<string, string[]> = {
    category: [],
    brand: [],
    product: [],
    variant: [],
  };
  for (const s of scopes) {
    const label = s.scopeRefLabel ?? (s.scopeRefId != null ? `#${s.scopeRefId}` : null);
    if (!label) continue;
    const key = s.scopeType in buckets ? s.scopeType : "product";
    buckets[key].push(label);
  }
  const parts: string[] = [];
  if (buckets.category.length > 0) parts.push(`Danh mục: ${buckets.category.join(", ")}`);
  if (buckets.brand.length > 0) parts.push(`Thương hiệu: ${buckets.brand.join(", ")}`);
  if (buckets.product.length > 0) parts.push(`Sản phẩm: ${buckets.product.join(", ")}`);
  if (buckets.variant.length > 0) parts.push(`Phiên bản: ${buckets.variant.join(", ")}`);
  if (parts.length === 0) return "Áp dụng theo cấu hình riêng.";
  return `Áp dụng cho — ${parts.join("; ")}.`;
}

function buildExample(p: Promotion): string {
  const action = p.actions?.[0];
  if (!action) return "Áp dụng tự động khi đủ điều kiện ở bước thanh toán.";

  switch (action.actionType) {
    case "percentage_discount": {
      const pct = toNumber(action.discountValue);
      const sample = 10_000_000;
      const rawDiscount = Math.round((sample * pct) / 100);
      const cap = action.maxDiscountAmount != null ? toNumber(action.maxDiscountAmount) : null;
      const finalDiscount = cap != null ? Math.min(rawDiscount, cap) : rawDiscount;
      const capText = cap != null && rawDiscount > cap
        ? ` (giới hạn ${formatVND(cap)})`
        : "";
      return `Ví dụ: Đơn ${formatVND(sample)} → giảm ${pct}% = ${formatVND(finalDiscount)}${capText}, bạn trả ${formatVND(sample - finalDiscount)}.`;
    }
    case "fixed_discount_item":
    case "fixed_discount_cart": {
      const v = toNumber(action.discountValue);
      const sample = 10_000_000;
      return `Ví dụ: Đơn ${formatVND(sample)} → giảm ngay ${formatVND(v)}, bạn trả ${formatVND(sample - v)}.`;
    }
    case "bxgy": {
      const buyQty = action.bxgyBuyQty ?? 1;
      const getQty = action.bxgyGetQty ?? 1;
      const pct = action.bxgyGetDiscountPct ?? 100;
      const total = buyQty + getQty;
      if (pct === 100) {
        return `Ví dụ: Bỏ ${total} sản phẩm vào giỏ → bạn chỉ trả tiền cho ${buyQty} sản phẩm, ${getQty} sản phẩm còn lại miễn phí.`;
      }
      return `Ví dụ: Mua ${buyQty} sản phẩm, ${getQty} sản phẩm tiếp theo được giảm ${pct}% giá.`;
    }
    case "bulk_discount": {
      const tiers = (action.bulkTiers ?? [])
        .slice()
        .sort((a, b) => b.minQuantity - a.minQuantity);
      const top = tiers[0];
      if (!top) return "Ví dụ: Mua càng nhiều, giảm càng sâu — xem bảng mức giảm phía trên.";
      const unit = top.discountType === "percentage" ? `${toNumber(top.discountValue)}%` : formatVND(toNumber(top.discountValue));
      return `Ví dụ: Mua ${top.minQuantity} sản phẩm cùng loại → được giảm ${unit} mỗi sản phẩm.`;
    }
    case "bundle_discount": {
      const v = toNumber(action.discountValue);
      const unit = action.discountType === "percentage" ? `${v}%` : formatVND(v);
      return `Ví dụ: Mua đủ các sản phẩm trong combo → tổng combo được giảm ${unit}.`;
    }
    case "free_shipping":
      return "Ví dụ: Đơn hàng đủ điều kiện sẽ tự động được miễn phí vận chuyển ở bước thanh toán.";
    default:
      return "Ưu đãi sẽ tự động áp dụng khi đủ điều kiện ở bước thanh toán.";
  }
}

export function explainPromotion(p: Promotion): PromotionExplanation {
  const mechanismLines: string[] = [];

  for (const cond of p.conditions ?? []) {
    mechanismLines.push(describeCondition(cond));
  }
  for (const action of p.actions ?? []) {
    mechanismLines.push(...describeAction(action));
  }
  if (mechanismLines.length === 0) {
    mechanismLines.push("Ưu đãi tự động áp dụng ở bước thanh toán.");
  }

  const validityLine = `Hiệu lực: ${formatDate(p.startDate)} – ${formatDate(p.endDate)}.`;
  const scopeLine = describeScopes(p.scopes ?? []);

  let usageLine: string | null = null;
  if (p.totalUsageLimit != null) {
    const remaining = Math.max(0, p.totalUsageLimit - p.usageCount);
    usageLine = `Đã dùng ${p.usageCount.toLocaleString("vi-VN")}/${p.totalUsageLimit.toLocaleString("vi-VN")} lượt (còn lại ${remaining.toLocaleString("vi-VN")}).`;
  } else if (p.usageCount > 0) {
    usageLine = `Đã dùng ${p.usageCount.toLocaleString("vi-VN")} lượt.`;
  }

  return {
    title: p.name,
    mechanismLines,
    example: buildExample(p),
    validityLine,
    scopeLine,
    usageLine,
    isCoupon: p.isCoupon,
    couponCode: p.code,
  };
}
