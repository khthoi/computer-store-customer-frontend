// Shape frontend expects from /pages and /pages/:slug — GROUND TRUTH.
// If backend deviates, fix backend DTO (workspace GOLDEN RULE).

export interface CmsPageListItem {
  id: number;
  slug: string;
  title: string;
  showInFooter: boolean;
  sortOrder: number;
  publishedAt: string | null;
}

export interface CmsPageDetail {
  id: number;
  title: string;
  slug: string;
  content: string;
  publishedAt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  showInFooter: boolean;
  showInHeader: boolean;
}
