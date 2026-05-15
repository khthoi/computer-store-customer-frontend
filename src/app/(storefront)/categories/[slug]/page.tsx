import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getBrands,
  getCategoryBySlug,
  getCategoryFacets,
  getCategoryTree,
} from "@/src/services/storefront-catalog-meta.service";
import { CategoryCatalogClient } from "./CategoryCatalogClient";
import CategoryLoading from "./loading";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Danh mục không tồn tại" };
  return {
    title: `${category.name} — PC Store`,
    description: category.description || `Sản phẩm thuộc danh mục ${category.name}`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const [category, brands, categoryTree, facets] = await Promise.all([
    getCategoryBySlug(slug),
    getBrands(),
    getCategoryTree(),
    getCategoryFacets(slug),
  ]);

  if (!category) notFound();

  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryCatalogClient
        category={category}
        brands={brands}
        categoryTree={categoryTree}
        facets={facets}
      />
    </Suspense>
  );
}
