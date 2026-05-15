import {
  getBrands,
  getCategoryTree,
  findCategoryBySlug,
  type StorefrontBrand,
  type StorefrontCategoryNode,
} from "@/src/services/storefront-catalog-meta.service";
import {
  getProductList,
  type ProductSort,
} from "@/src/services/storefront-product-list.service";
import { getSearchSuggestions } from "@/src/services/storefront-layout.service";
import type {
  StorefrontSearchParams,
  StorefrontSearchResults,
  StorefrontSearchSort,
} from "@/src/types/storefront-search.types";

function resolveCategoryId(
  tree: StorefrontCategoryNode[],
  slug: string | undefined,
): number | undefined {
  if (!slug) return undefined;
  const node = findCategoryBySlug(tree, slug);
  return node ? node.id : undefined;
}

function resolveBrandId(
  brands: StorefrontBrand[],
  slug: string | undefined,
): number | undefined {
  if (!slug) return undefined;
  const brand = brands.find((b) => b.slug === slug);
  return brand ? brand.id : undefined;
}

function toProductSort(value: StorefrontSearchSort | undefined): ProductSort {
  return (value ?? "bestselling") as ProductSort;
}

export async function getStorefrontSearchResults(
  params: StorefrontSearchParams,
): Promise<StorefrontSearchResults> {
  const trimmedQuery = params.q.trim();

  const [brands, categoryTree] = await Promise.all([
    getBrands(),
    getCategoryTree(),
  ]);

  const categoryId = resolveCategoryId(categoryTree, params.categorySlug);
  const brandId = resolveBrandId(brands, params.brandSlug);

  const [list, suggestions] = await Promise.all([
    getProductList({
      q: trimmedQuery || undefined,
      categoryId,
      brandId,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      inStock: params.inStock,
      ratingMin: params.ratingMin,
      sort: toProductSort(params.sort),
      page: params.page,
      limit: params.limit,
    }),
    trimmedQuery.length >= 2
      ? getSearchSuggestions(trimmedQuery).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    query: trimmedQuery,
    products: list.items,
    total: list.total,
    page: list.page,
    limit: list.limit,
    totalPages: list.totalPages,
    relatedCategories: suggestions?.categories ?? [],
    relatedBrands: suggestions?.brands ?? [],
  };
}
