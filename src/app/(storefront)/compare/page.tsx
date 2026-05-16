import { CompareProvider } from "@/src/store/compare.store";
import { ComparePageClient } from "@/src/app/(storefront)/compare/ComparePageClient";
import {
  getCompareCatalogue,
  getInitialCompareVariants,
} from "@/src/services/compare.service";
import { getProductList } from "@/src/services/storefront-product-list.service";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const [catalogue, popularResult, initialVariants] = await Promise.all([
    getCompareCatalogue({ limit: 60 }),
    // "Popular" suggestions: most-reviewed → highest-rated → newest.
    // 12 items = 2 full carousel windows at itemsPerView=6 for richer browsing.
    getProductList({ page: 1, limit: 12, sort: "popular" }).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    })),
    getInitialCompareVariants([]),
  ]);

  return (
    <CompareProvider
      initialProducts={initialVariants}
      productCatalogue={[]}
    >
      <ComparePageClient
        catalogue={catalogue}
        popularProducts={popularResult.items}
      />
    </CompareProvider>
  );
}
