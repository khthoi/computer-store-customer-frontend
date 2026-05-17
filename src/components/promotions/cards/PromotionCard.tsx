import {
  GiftIcon,
  TagIcon,
  TruckIcon,
  SparklesIcon,
  Squares2X2Icon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "@/src/components/ui/Badge";
import { CopyCouponButton } from "./CopyCouponButton";
import { explainPromotion } from "@/src/lib/promotion-explainer";
import { PromotionProducts } from "./PromotionProducts";
import type { Promotion, PromotionType } from "@/src/types/promotion.types";
import type { StorefrontProductCardDto } from "@/src/types/storefront-product-card.types";

export interface PromotionCardProps {
  promotion: Promotion;
  /** When true, the coupon code + copy button is rendered. */
  showCouponCode?: boolean;
  /** Products in scope of this promotion (already filtered by caller). */
  products?: StorefrontProductCardDto[];
}

const TYPE_META: Record<
  PromotionType,
  { label: string; Icon: typeof TagIcon }
> = {
  standard: { label: "Khuyến mãi", Icon: TagIcon },
  bxgy: { label: "Mua X tặng Y", Icon: GiftIcon },
  bundle: { label: "Combo", Icon: Squares2X2Icon },
  bulk: { label: "Mua nhiều giảm sâu", Icon: CubeIcon },
  free_shipping: { label: "Miễn phí vận chuyển", Icon: TruckIcon },
};

export function PromotionCard({
  promotion,
  showCouponCode = false,
  products,
}: PromotionCardProps) {
  const meta = TYPE_META[promotion.type] ?? {
    label: "Ưu đãi",
    Icon: SparklesIcon,
  };
  const Icon = meta.Icon;
  const explanation = explainPromotion(promotion);

  return (
    <article className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Top block: promotion info only */}
      <div className="p-5">
        <header className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm">
                {meta.label}
              </Badge>
              {promotion.isCoupon ? (
                <Badge variant="warning" size="sm">
                  Cần nhập mã
                </Badge>
              ) : (
                <Badge variant="success" size="sm">
                  Tự động áp dụng
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold leading-tight text-secondary-900">
              {explanation.title}
            </h3>
            {promotion.description ? (
              <p className="mt-1 text-sm text-secondary-500">
                {promotion.description}
              </p>
            ) : null}
          </div>
        </header>

        {showCouponCode && promotion.code ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-primary-300 bg-primary-50/60 px-4 py-3">
            <code className="font-mono text-lg font-bold tracking-wider text-primary-700">
              {promotion.code}
            </code>
            <CopyCouponButton code={promotion.code} />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 text-sm text-secondary-700 md:grid-cols-2">
          <div>
            <p className="mb-1 font-semibold text-secondary-900">Cách hoạt động</p>
            <ul className="list-disc space-y-1 pl-5">
              {explanation.mechanismLines.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-secondary-50 px-3 py-2 text-sm italic text-secondary-700">
            {explanation.example}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-secondary-100 pt-3 text-xs text-secondary-500">
          <span>{explanation.scopeLine}</span>
          <span>{explanation.validityLine}</span>
          {explanation.usageLine ? <span>{explanation.usageLine}</span> : null}
        </div>
      </div>

      {/* Bottom block: products applied — separated by background */}
      <div className="border-t border-secondary-100 bg-secondary-50/60 p-5">
        <PromotionProducts products={products ?? []} />
      </div>
    </article>
  );
}
