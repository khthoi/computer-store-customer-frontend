"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCompare } from "@/src/store/compare.store";
import { getCompareVariantById } from "@/src/services/compare.service";
import type { CatalogueProduct } from "@/src/components/compare-ui/types";

interface CompareDataBridgeProps {
  /** Used to resolve product slug + variantId from a compare-product compound id. */
  catalogue: CatalogueProduct[];
}

interface LookupEntry {
  slug: string;
  variantId: string;
}

/**
 * Watches compareList for products with empty specGroups and lazy-fetches
 * variant detail + specs from the backend, then updates the store entry.
 *
 * The drawer builds compare-product ids using the pattern
 * `<productId>__<variantId>` (or just `<productId>` when the variant value is
 * "default"). We resolve back to (slug, variantId) using the catalogue prop.
 */
export function CompareDataBridge({ catalogue }: CompareDataBridgeProps) {
  const { state, updateProduct } = useCompare();
  const inFlight = useRef<Set<string>>(new Set());

  const lookup = useMemo(() => {
    const map = new Map<string, LookupEntry>();
    for (const p of catalogue) {
      const variants = p.variants ?? [];
      if (variants.length === 0) {
        map.set(p.id, { slug: p.slug, variantId: p.id });
        continue;
      }
      for (const v of variants) {
        const compoundId =
          v.value === "default" ? p.id : `${p.id}__${v.value}`;
        map.set(compoundId, { slug: p.slug, variantId: v.value });
      }
    }
    return map;
  }, [catalogue]);

  useEffect(() => {
    for (const item of state.compareList) {
      if (item.specGroups.length > 0) continue;
      if (inFlight.current.has(item.id)) continue;

      const entry = lookup.get(item.id);
      if (!entry) continue;

      inFlight.current.add(item.id);
      getCompareVariantById({
        productSlug: entry.slug,
        variantId: entry.variantId,
      })
        .then((full) => {
          if (!full) return;
          // Re-key the fetched product to the compound id used by the store.
          const rekeyed = {
            ...full,
            id: item.id,
            specGroups: full.specGroups.map((g) => ({
              ...g,
              rows: g.rows.map((r) => ({
                ...r,
                values: { [item.id]: r.values[entry.variantId] ?? "" },
              })),
            })),
          };
          updateProduct(rekeyed);
        })
        .finally(() => {
          inFlight.current.delete(item.id);
        });
    }
  }, [state.compareList, lookup, updateProduct]);

  return null;
}
