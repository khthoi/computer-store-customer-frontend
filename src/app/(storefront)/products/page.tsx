import { Suspense } from "react";
import {
  getBrands,
  getCategoryTree,
} from "@/src/services/storefront-catalog-meta.service";
import { ProductsCatalogClient } from "./ProductsCatalogClient";
import ProductsLoading from "./loading";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [brands, categoryTree] = await Promise.all([
    getBrands(),
    getCategoryTree(),
  ]);

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsCatalogClient brands={brands} categoryTree={categoryTree} />
    </Suspense>
  );
}
