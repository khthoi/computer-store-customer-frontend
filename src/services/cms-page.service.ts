import { apiFetch } from "@/src/services/api";
import type { CmsPageDetail, CmsPageListItem } from "@/src/types/cms-page.types";

export async function getPublishedPages(): Promise<CmsPageListItem[]> {
  return apiFetch<CmsPageListItem[]>("/pages");
}

export async function getPageBySlug(slug: string): Promise<CmsPageDetail> {
  return apiFetch<CmsPageDetail>(`/pages/${encodeURIComponent(slug)}`);
}
