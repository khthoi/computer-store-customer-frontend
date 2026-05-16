// ─── Category ─────────────────────────────────────────────────────────────────
//
// Compare grouping is keyed by the root categoryId from the backend tree, so
// any new category added by admin works without code changes. `ProductCategory`
// is kept as a string alias for source-level compatibility — the actual value
// stored here is the backend root categoryId.

export type ProductCategory = string;

// ─── Spec structures ──────────────────────────────────────────────────────────

export interface CompareSpecRow {
  key: string;
  label: string;
  /** productId → display value */
  values: Record<string, string>;
  /** Unit suffix shown after each value, e.g. "GB", "Hz", "W" */
  unit?: string;
  /**
   * When true, the cell with the highest numeric prefix is highlighted as
   * "best". When false, the lowest is best. When undefined, no winner shown.
   */
  higherIsBetter?: boolean;
}

export interface CompareSpecGroup {
  key: string;
  label: string;
  rows: CompareSpecRow[];
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface CompareProduct {
  id: string;
  name: string;
  brands: string[];
  slug: string;
  /** Backend leaf category id (as string) — used to scope drawer queries. */
  categoryId: string;
  /** Leaf category name (for display). */
  categoryName: string;
  /** Backend root category id — used as the compare-group lock key. */
  rootCategoryId: string;
  /** Root category name (shown in compare bar / drawer header). */
  rootCategoryName: string;
  /**
   * @deprecated — kept for backward compatibility with older localStorage
   * entries. Equals `rootCategoryId` for new entries. Do not branch on it.
   */
  category: ProductCategory;
  currentPrice: number;
  originalPrice: number;
  discountPct: number;
  thumbnailSrc: string;
  rating: number;
  reviewCount: number;
  specGroups: CompareSpecGroup[];
}

// ─── Drawer catalogue item ─────────────────────────────────────────────────────

/** A single selectable variant option shown in the drawer's variant Select. */
export interface ProductVariant {
  value: string;
  label: string;
  /** Override the base product's current price for this specific variant. */
  currentPrice?: number;
  /** Override the base product's original/list price for this specific variant. */
  originalPrice?: number;
  /** Marks the variant the storefront should pre-select by default. */
  isDefault?: boolean;
}

/** A lightweight product entry shown in the add-product drawer. */
export interface CatalogueProduct {
  id: string;
  name: string;
  brands: string[];
  slug: string;
  /** Backend leaf category id (as string) — used to scope drawer queries. */
  categoryId: string;
  /** Leaf category name (for display). */
  categoryName: string;
  /** Backend root category id — used as the compare-group lock key. */
  rootCategoryId: string;
  /** Root category name. */
  rootCategoryName: string;
  /**
   * @deprecated — kept for backward compatibility. Equals `rootCategoryId`
   * for new entries.
   */
  category: ProductCategory;
  currentPrice: number;
  originalPrice: number;
  thumbnailSrc: string;
  rating: number;
  reviewCount: number;
  /** Selectable configurations (e.g. "16GB / 512GB SSD"). When absent, a
   *  single "Mặc định" option is used so the Select always renders. */
  variants?: ProductVariant[];
}

// ─── Facet schema (from GET /specs/categories/:id/facets) ─────────────────────

export type CompareFacetWidget = "checkbox" | "select" | "range" | "toggle";

export interface CompareFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface CompareFacetType {
  key: string;
  specTypeId: number;
  label: string;
  unit: string | null;
  widget: CompareFacetWidget;
  displayOrder: number;
  options?: CompareFacetOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface CompareFacetGroup {
  id: string;
  label: string;
  displayOrder: number;
  types: CompareFacetType[];
}

// ─── Drawer filter / pagination state ─────────────────────────────────────────

export interface CompareSpecFilterValue {
  values?: string[];
  min?: number;
  max?: number;
  toggle?: boolean;
}

export interface CompareSearchParams {
  categoryId: string | null;
  /** Vietnamese category name fallback when no numeric id is available. */
  categoryName?: string | null;
  page: number;
  limit: number;
  q?: string;
  brandId?: string;
  /** Multi-brand filter — OR-matches across all supplied ids. */
  brandIds?: string[];
  minPrice?: number;
  maxPrice?: number;
  /** specTypeId → filter value */
  specs?: Record<number, CompareSpecFilterValue>;
}

// ─── Brand catalogue (drawer filter) ──────────────────────────────────────────

export interface CompareBrand {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
}

export interface CompareSearchResult {
  items: CatalogueProduct[];
  total: number;
  page: number;
  totalPages: number;
}
