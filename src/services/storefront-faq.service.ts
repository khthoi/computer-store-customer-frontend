import { apiFetch } from "@/src/services/api";
import type { FaqPublicGroup } from "@/src/types/faq.types";

export async function getPublicFaq(): Promise<FaqPublicGroup[]> {
  return apiFetch<FaqPublicGroup[]>("/faq");
}

export async function markFaqHelpful(id: string): Promise<void> {
  await apiFetch<void>(`/faq/items/${encodeURIComponent(id)}/helpful`, {
    method: "POST",
  });
}
