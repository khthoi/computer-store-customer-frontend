import { CompareProvider } from "@/src/store/compare.store";
import { ComparePageClient } from "@/src/app/(storefront)/compare/ComparePageClient";
import {
  getCompareCatalogue,
  getSuggestedProducts,
  getInitialCompareVariants,
} from "@/src/services/compare.service";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const [catalogue, suggestedProducts, initialVariants] = await Promise.all([
    getCompareCatalogue({ limit: 60 }),
    getSuggestedProducts(8),
    getInitialCompareVariants([]),
  ]);

  return (
    <CompareProvider
      initialProducts={initialVariants}
      productCatalogue={[]}
    >
      <ComparePageClient
        catalogue={catalogue}
        suggestedProducts={suggestedProducts}
      />
    </CompareProvider>
  );
}
