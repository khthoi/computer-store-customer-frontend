import { storefrontApiFetch } from "@/src/services/storefront-api.service";

export interface StorefrontBrand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  isVisible?: boolean;
}

interface BackendBrand {
  id: string | number;
  name: string;
  slug: string;
  logo?: string | null;
  logoUrl?: string | null;
  active?: boolean;
  isVisible?: boolean;
}

function mapBackendBrand(b: BackendBrand): StorefrontBrand {
  return {
    id: typeof b.id === "string" ? Number(b.id) : b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logoUrl ?? b.logo ?? null,
    isVisible: b.isVisible ?? b.active,
  };
}

export interface StorefrontCategoryNode {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  productCount?: number;
  children: StorefrontCategoryNode[];
}

export interface StorefrontCategoryDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  parentId: number | null;
  productCount?: number;
  children: StorefrontCategoryNode[];
}

interface BackendCategoryDetail {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  icon?: string | null;
  parentId?: string | number | null;
  productCount?: number;
  children?: StorefrontCategoryNode[];
}

function toNumericId(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}

function mapBackendCategoryDetail(raw: BackendCategoryDetail): StorefrontCategoryDetail {
  return {
    id: toNumericId(raw.id) ?? 0,
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? "",
    icon: raw.icon ?? null,
    parentId: toNumericId(raw.parentId ?? null),
    productCount: raw.productCount,
    children: Array.isArray(raw.children) ? raw.children : [],
  };
}

export async function getCategoryBySlug(
  slug: string,
): Promise<StorefrontCategoryDetail | null> {
  try {
    const raw = await storefrontApiFetch<BackendCategoryDetail>(
      `/categories/${encodeURIComponent(slug)}`,
      { next: { revalidate: 600 } },
    );
    if (!raw) return null;
    return mapBackendCategoryDetail(raw);
  } catch {
    return null;
  }
}

interface PaginatedBrands {
  data: BackendBrand[];
  total?: number;
}

export async function getBrands(): Promise<StorefrontBrand[]> {
  try {
    const result = await storefrontApiFetch<BackendBrand[] | PaginatedBrands>(
      "/brands?limit=200",
      { next: { revalidate: 600 } },
    );
    const list = Array.isArray(result)
      ? result
      : result && Array.isArray(result.data)
        ? result.data
        : [];
    return list.map(mapBackendBrand);
  } catch {
    return [];
  }
}

interface PaginatedCategories {
  data: StorefrontCategoryNode[];
}

export async function getCategoryTree(): Promise<StorefrontCategoryNode[]> {
  try {
    const result = await storefrontApiFetch<
      StorefrontCategoryNode[] | PaginatedCategories
    >("/categories", { next: { revalidate: 600 } });
    if (Array.isArray(result)) return result;
    if (result && Array.isArray(result.data)) return result.data;
    return [];
  } catch {
    return [];
  }
}

export function flattenCategoryTree(nodes: StorefrontCategoryNode[]): StorefrontCategoryNode[] {
  const result: StorefrontCategoryNode[] = [];
  const walk = (list: StorefrontCategoryNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return result;
}

export type FacetWidget = "checkbox" | "range" | "toggle" | "select";

export interface StorefrontFacetOption {
  value: string;
  label: string;
  count: number;
}

export interface StorefrontFacetType {
  key: string;
  specTypeId: number;
  label: string;
  unit: string | null;
  widget: FacetWidget;
  displayOrder: number;
  options?: StorefrontFacetOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface StorefrontFacetGroup {
  id: string;
  label: string;
  displayOrder: number;
  types: StorefrontFacetType[];
}

export async function getCategoryFacets(
  slug: string,
): Promise<StorefrontFacetGroup[]> {
  try {
    const data = await storefrontApiFetch<StorefrontFacetGroup[]>(
      `/categories/${encodeURIComponent(slug)}/facets`,
      { cache: "no-store" },
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function findCategoryBySlug(
  nodes: StorefrontCategoryNode[],
  slug: string,
): StorefrontCategoryNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    if (node.children?.length) {
      const hit = findCategoryBySlug(node.children, slug);
      if (hit) return hit;
    }
  }
  return null;
}
