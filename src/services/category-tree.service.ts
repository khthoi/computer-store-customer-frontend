import { storefrontApiFetch } from "@/src/services/storefront-api.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendCategoryNode {
  id: number | string;
  name?: string;
  slug?: string;
  isComparisonRoot?: boolean;
  children?: BackendCategoryNode[];
}

export interface CategoryTreeIndex {
  /** categoryId → topmost ancestor categoryId */
  rootIdByCategoryId: Map<string, string>;
  /** categoryId → topmost ancestor categoryName */
  rootNameByCategoryId: Map<string, string>;
  /** categoryId → leaf category name (for display fallbacks) */
  nameByCategoryId: Map<string, string>;
}

// ─── Module-scope cache ───────────────────────────────────────────────────────
//
// Resolved once per browser tab. Fetched lazily on first lookup so static
// pages don't pay the cost during render.

let cachedTree: Promise<CategoryTreeIndex> | null = null;

function buildIndex(tree: BackendCategoryNode[]): CategoryTreeIndex {
  const rootIdByCategoryId = new Map<string, string>();
  const rootNameByCategoryId = new Map<string, string>();
  const nameByCategoryId = new Map<string, string>();

  // The "comparison root" of a node is the nearest ancestor (including itself)
  // marked with `isComparisonRoot=true`. If no ancestor on the path is flagged,
  // we fall back to the topmost ancestor (legacy behaviour) so the page keeps
  // working before admins flag any category.
  function walk(
    node: BackendCategoryNode,
    inheritedRootId: string,
    inheritedRootName: string,
  ) {
    const selfId = String(node.id);
    const selfName = node.name ?? "";
    const isFlagged = Boolean(node.isComparisonRoot);

    const currentRootId = isFlagged ? selfId : inheritedRootId;
    const currentRootName = isFlagged ? selfName : inheritedRootName;

    rootIdByCategoryId.set(selfId, currentRootId);
    rootNameByCategoryId.set(selfId, currentRootName);
    nameByCategoryId.set(selfId, selfName);

    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child, currentRootId, currentRootName);
    }
  }

  for (const root of tree) {
    // Top-level node: it is its own fallback root. If it's itself flagged the
    // walk will keep that; otherwise descendants inherit the topmost ancestor
    // until a flagged node overrides it deeper in the tree.
    walk(root, String(root.id), root.name ?? "");
  }
  return { rootIdByCategoryId, rootNameByCategoryId, nameByCategoryId };
}

async function fetchAndBuild(): Promise<CategoryTreeIndex> {
  try {
    const tree = await storefrontApiFetch<BackendCategoryNode[]>(
      "/categories",
      { cache: "no-store" },
    );
    return buildIndex(Array.isArray(tree) ? tree : []);
  } catch {
    return {
      rootIdByCategoryId: new Map(),
      rootNameByCategoryId: new Map(),
      nameByCategoryId: new Map(),
    };
  }
}

export function getCategoryTreeIndex(): Promise<CategoryTreeIndex> {
  if (!cachedTree) cachedTree = fetchAndBuild();
  return cachedTree;
}

/**
 * Resolve { rootId, rootName } for a backend categoryId.
 * Falls back to the leaf id/name when the category isn't in the tree
 * (e.g. archived parent or stale cache).
 */
export async function resolveCategoryRoot(
  categoryId: string | null | undefined,
  leafName?: string | null,
): Promise<{ rootCategoryId: string; rootCategoryName: string }> {
  if (!categoryId) {
    return { rootCategoryId: "", rootCategoryName: leafName ?? "" };
  }
  const idx = await getCategoryTreeIndex();
  const rootId = idx.rootIdByCategoryId.get(categoryId) ?? categoryId;
  const rootName =
    idx.rootNameByCategoryId.get(categoryId) ??
    idx.nameByCategoryId.get(categoryId) ??
    leafName ??
    "";
  return { rootCategoryId: rootId, rootCategoryName: rootName };
}

/** Drop the in-memory cache — call after admin modifies the tree. */
export function clearCategoryTreeCache(): void {
  cachedTree = null;
}
