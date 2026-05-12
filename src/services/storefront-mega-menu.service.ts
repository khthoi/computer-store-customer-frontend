import type {
  SidebarMenuCategory,
  SidebarMenuLink,
  SidebarMenuSection,
} from "@/src/components/navigation";
import { buildCategoryHref } from "@/src/services/storefront-layout.service";
import type { StorefrontCategoryNode } from "@/src/types/storefront-layout.types";

export const MEGA_MENU_PREVIEW_CHILD_LIMIT = 6;
const MEGA_MENU_COLUMN_COUNT = 4;

function toSidebarLink(node: StorefrontCategoryNode): SidebarMenuLink {
  return {
    label: node.name,
    href: buildCategoryHref(node),
    badge: node.badgeText ?? undefined,
    hasChildren: Boolean(node.children?.length),
    children: node.children
      ?.filter((child) => child.nodeType !== "label")
      .map(toSidebarLink),
  };
}

function chunkSections(sections: SidebarMenuSection[]): SidebarMenuSection[][] {
  if (sections.length <= MEGA_MENU_COLUMN_COUNT) {
    return sections.map((section) => [section]);
  }

  const columns: SidebarMenuSection[][] = Array.from(
    { length: Math.min(MEGA_MENU_COLUMN_COUNT, sections.length) },
    () => [],
  );

  sections.forEach((section, index) => {
    columns[index % columns.length].push(section);
  });

  return columns.filter((column) => column.length > 0);
}

function toSidebarSection(
  sectionNode: StorefrontCategoryNode,
): SidebarMenuSection {
  const headingHref =
    sectionNode.nodeType === "label" ? undefined : buildCategoryHref(sectionNode);
  const sectionChildren = (sectionNode.children ?? []).filter(
    (child) => child.nodeType !== "label",
  );

  if (sectionChildren.length === 0) {
    return {
      id: sectionNode.id,
      heading: sectionNode.name,
      headingHref,
      headingBadge: sectionNode.badgeText ?? undefined,
      items:
        sectionNode.nodeType === "label"
          ? []
          : [{ label: "Xem tất cả", href: headingHref ?? "#" }],
    };
  }

  const visibleChildren = sectionChildren
    .slice(0, MEGA_MENU_PREVIEW_CHILD_LIMIT)
    .map(toSidebarLink);
  const hiddenChildren = sectionChildren
    .slice(MEGA_MENU_PREVIEW_CHILD_LIMIT)
    .map(toSidebarLink);

  return {
    id: sectionNode.id,
    heading: sectionNode.name,
    headingHref,
    headingBadge: sectionNode.badgeText ?? undefined,
    items: visibleChildren,
    hiddenItems: hiddenChildren.length > 0 ? hiddenChildren : undefined,
  };
}

function toSidebarCategory(node: StorefrontCategoryNode): SidebarMenuCategory {
  const sections = (node.children ?? []).map((child) => toSidebarSection(child));

  return {
    id: node.id,
    label: node.name,
    href: buildCategoryHref(node),
    badge: node.badgeText ?? undefined,
    panel:
      sections.length > 0
        ? {
            columns: chunkSections(sections),
          }
        : undefined,
  };
}

export function toSidebarCategories(
  categories: StorefrontCategoryNode[],
): SidebarMenuCategory[] {
  return categories.filter((item) => item.active).map(toSidebarCategory);
}
