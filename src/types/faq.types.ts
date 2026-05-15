// FAQ domain types — public storefront contract.

export interface FaqPublicItem {
  id: string;
  question: string;
  answer: string;
  helpfulCount: number;
}

export interface FaqPublicGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  items: FaqPublicItem[];
}
