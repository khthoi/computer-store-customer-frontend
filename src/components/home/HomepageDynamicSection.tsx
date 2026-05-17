import Link from "next/link";
import { ProductCardConnected } from "@/src/components/product/card/ProductCardConnected";
import { HomepageProductCarousel } from "./HomepageProductCarousel";
import type {
  StorefrontHomepageSection,
  StorefrontSectionLayout,
} from "@/src/types/storefront-homepage-section.types";

interface HomepageDynamicSectionProps {
  section: StorefrontHomepageSection;
}

const GRID_CLASSES: Record<Exclude<StorefrontSectionLayout, "carousel">, string> = {
  grid_3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  grid_4: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4",
  grid_6: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4",
};

function SectionBadge({
  label,
  bg,
  fg,
}: {
  label: string;
  bg?: string;
  fg?: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg ?? "#7C3AED", color: fg ?? "#FFFFFF" }}
    >
      {label}
    </span>
  );
}

export function HomepageDynamicSection({ section }: HomepageDynamicSectionProps) {
  const badgeNode = section.badgeLabel ? (
    <SectionBadge
      label={section.badgeLabel}
      bg={section.badgeColor ?? undefined}
      fg={section.badgeTextColor ?? undefined}
    />
  ) : undefined;

  if (section.layout === "carousel") {
    if (!section.products.length) {
      return (
        <section
          aria-labelledby={`hps-${section.sectionId}`}
          className="py-6 bg-secondary-50 max-w-[1400px] mx-auto"
        >
          <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
            <div className="mb-3 flex items-center gap-3">
              <h2 id={`hps-${section.sectionId}`} className="text-lg font-bold text-secondary-900">
                {section.title}
              </h2>
              {badgeNode}
            </div>
            <p className="text-sm text-secondary-500">Chưa có sản phẩm trong khối này.</p>
          </div>
        </section>
      );
    }
    return (
      <HomepageProductCarousel
        title={section.title}
        href={section.viewAllUrl}
        products={section.products}
        badgeNode={badgeNode}
      />
    );
  }

  const gridClass = GRID_CLASSES[section.layout];
  return (
    <section
      aria-labelledby={`hps-${section.sectionId}`}
      className="py-6 bg-secondary-50 max-w-[1400px] mx-auto"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2
              id={`hps-${section.sectionId}`}
              className="text-lg font-bold text-secondary-900"
            >
              {section.title}
            </h2>
            {badgeNode}
          </div>
          {section.viewAllUrl && (
            <Link
              href={section.viewAllUrl}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Xem tất cả →
            </Link>
          )}
        </div>
        {section.products.length === 0 ? (
          <p className="text-sm text-secondary-500">Chưa có sản phẩm trong khối này.</p>
        ) : (
          <div className={gridClass}>
            {section.products.map((p) => (
              <ProductCardConnected key={p.variantId} dto={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
