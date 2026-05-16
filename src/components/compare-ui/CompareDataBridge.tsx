"use client";

import { useEffect, useRef } from "react";
import { useCompare } from "@/src/store/compare.store";
import { getCompareVariantById } from "@/src/services/compare.service";
import type { CatalogueProduct } from "@/src/components/compare-ui/types";

interface CompareDataBridgeProps {
  /**
   * Optional seed catalogue used as a fallback when a compound id contains a
   * "default" variant sentinel. The compare item itself carries enough info
   * (slug + compound id) to fetch its specs without this prop.
   */
  catalogue?: CatalogueProduct[];
}

function parseCompoundId(id: string): { productId: string; variantId: string } {
  const idx = id.indexOf("__");
  if (idx === -1) return { productId: id, variantId: id };
  return { productId: id.slice(0, idx), variantId: id.slice(idx + 2) };
}

/**
 * Watches compareList for products with empty specGroups and lazy-fetches
 * variant detail + specs from the backend, then updates the store entry.
 *
 * Resolution: slug comes directly from the compare item; variantId is parsed
 * from the compound id (`<productId>__<variantId>`). For single-variant items
 * without a compound, the seed catalogue is consulted to find the real variant.
 */
export function CompareDataBridge({ catalogue = [] }: CompareDataBridgeProps) {
  const { state, updateProduct } = useCompare();
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const item of state.compareList) {
      if (item.specGroups.length > 0) continue;
      if (inFlight.current.has(item.id)) continue;
      if (!item.slug) continue;

      const parsed = parseCompoundId(item.id);
      let variantId = parsed.variantId;
      // No "__" in id → resolve via seed catalogue if available.
      if (variantId === parsed.productId) {
        const seed = catalogue.find((p) => p.id === parsed.productId);
        const firstVariant = seed?.variants?.[0];
        if (firstVariant && firstVariant.value !== "default") {
          variantId = firstVariant.value;
        }
      }

      inFlight.current.add(item.id);
      getCompareVariantById({
        productSlug: item.slug,
        variantId,
      })
        .then((full) => {
          if (!full) return;
          const rekeyed = {
            ...full,
            id: item.id,
            specGroups: full.specGroups.map((g) => ({
              ...g,
              rows: g.rows.map((r) => ({
                ...r,
                values: { [item.id]: r.values[variantId] ?? "" },
              })),
            })),
          };
          updateProduct(rekeyed);
        })
        .finally(() => {
          inFlight.current.delete(item.id);
        });
    }
  }, [state.compareList, catalogue, updateProduct]);

  return null;
}
