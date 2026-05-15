import { apiFetch } from "@/src/services/api";
import type {
  BannerPosition,
  PublicBanner,
} from "@/src/types/storefront-banner.types";

export async function getBannersByPosition(
  position: BannerPosition,
): Promise<PublicBanner[]> {
  try {
    return await apiFetch<PublicBanner[]>(`/banners/${position}`);
  } catch {
    return [];
  }
}
