import { SearchResultsPageInner } from "@/src/components/search/SearchResultsPageInner";
import { getStorefrontSearchResults } from "@/src/services/storefront-search.service";
import { getBrands } from "@/src/services/storefront-catalog-meta.service";
import type { StorefrontSearchSort } from "@/src/types/storefront-search.types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

const VALID_SORTS: StorefrontSearchSort[] = [
  "bestselling",
  "price-asc",
  "price-desc",
  "newest",
  "rating",
];

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parsePositiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function parseSort(value: string | undefined): StorefrontSearchSort {
  if (value && (VALID_SORTS as string[]).includes(value)) {
    return value as StorefrontSearchSort;
  }
  return "bestselling";
}

/**
 * /search — Storefront search results page.
 *
 * Server component (force-dynamic) — reads all filter/sort/page state from URL,
 * calls the backend product list + suggestion endpoints in parallel, and
 * delegates interactivity to SearchResultsPageInner.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;

  const q = (firstParam(sp.q) ?? "").trim();
  const categorySlug = firstParam(sp.category);
  const brandSlug = firstParam(sp.brand);
  const minPrice = parsePositiveInt(firstParam(sp.minPrice));
  const maxPrice = parsePositiveInt(firstParam(sp.maxPrice));
  const inStock = firstParam(sp.inStock) === "1";
  const ratingMin = parsePositiveInt(firstParam(sp.rating));
  const sort = parseSort(firstParam(sp.sort));
  const page = Math.max(1, parsePositiveInt(firstParam(sp.page)) ?? 1);

  const [results, brands] = await Promise.all([
    getStorefrontSearchResults({
      q,
      categorySlug,
      brandSlug,
      minPrice,
      maxPrice,
      inStock: inStock || undefined,
      ratingMin: ratingMin && ratingMin >= 1 && ratingMin <= 5 ? ratingMin : undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    getBrands(),
  ]);

  return (
    <SearchResultsPageInner
      key={`${q}-${categorySlug ?? ""}-${brandSlug ?? ""}-${sort}-${page}`}
      results={results}
      query={q}
      brands={brands}
      initialState={{
        categorySlug,
        brandSlug,
        minPrice,
        maxPrice,
        inStock,
        ratingMin,
        sort,
        page,
      }}
    />
  );
}
