// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  ProductCategory,
  CompareProduct,
  CompareSpecGroup as CompareSpecGroupType,
  CompareSpecRow,
  CatalogueProduct,
} from "./types";

// ─── Components ───────────────────────────────────────────────────────────────
export { EmptyCompareState } from "./state/EmptyCompareState";
export type { EmptyCompareStateProps } from "./state/EmptyCompareState";

export { CompareHighlightToggle } from "./table/CompareHighlightToggle";
export type { CompareHighlightToggleProps } from "./table/CompareHighlightToggle";

export { CompareHeaderCard } from "./header/CompareHeaderCard";
export type { CompareHeaderCardProps } from "./header/CompareHeaderCard";

export { CompareRow } from "./table/CompareRow";
export type { CompareRowProps } from "./table/CompareRow";

export { CompareSpecGroup } from "./table/CompareSpecGroup";
export type { CompareSpecGroupProps } from "./table/CompareSpecGroup";

export { CompareTable } from "./table/CompareTable";

export { CompareHeaderCardList } from "./header/CompareHeaderCardList";

export { CompareBar } from "./header/CompareBar";

export { CompareProductDrawer } from "./drawer/CompareProductDrawer";
export type { CompareProductDrawerProps } from "./drawer/CompareProductDrawer";
