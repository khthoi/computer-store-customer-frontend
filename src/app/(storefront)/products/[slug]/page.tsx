import { notFound } from "next/navigation";
import { ProductHeroSection } from "@/src/components/product/ProductHeroSection";
import { ProductTabsSection } from "@/src/components/product/ProductTabsSection";
import { RelatedProductsSection } from "@/src/components/product/RelatedProductsSection";
import { RecentlyViewedSection } from "@/src/components/product/RecentlyViewedSection";
import type { ProductDetail } from "@/src/components/product/types";
import {
  getProductBySlugWithMeta,
  getVariantSpecs,
  getProductReviews,
  getRelatedProducts,
} from "@/src/services/product-detail.service";

// Revalidate every 30 minutes (storefront convention)
export const revalidate = 1800;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductDetail;
  let categoryId: string | null;
  let defaultVariantId: string;
  try {
    const result = await getProductBySlugWithMeta(slug);
    product = result.product;
    categoryId = result.categoryId;
    defaultVariantId = result.defaultVariantId;
  } catch (error: unknown) {
    if (isNotFoundError(error)) notFound();
    throw error;
  }

  const [specGroups, reviewsResult, relatedProducts] = await Promise.all([
    defaultVariantId
      ? getVariantSpecs(defaultVariantId).catch(() => [])
      : Promise.resolve([]),
    getProductReviews(product.id, 1, 10).catch(() => ({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    })),
    categoryId
      ? getRelatedProducts(categoryId, product.id, 10).catch(() => [])
      : Promise.resolve([]),
  ]);

  const productDetail: ProductDetail = {
    ...product,
    specGroups,
    reviews: reviewsResult.items,
    ratingDistribution: reviewsResult.distribution,
    relatedProducts,
  };

  return (
    <main className="min-h-screen bg-secondary-50 pb-24 lg:pb-0 max-w-[1430px] mx-auto flex flex-col">
      <ProductHeroSection product={productDetail} />
      <ProductTabsSection product={productDetail} />
      <RelatedProductsSection products={productDetail.relatedProducts} />
      <RecentlyViewedSection products={[]} />
    </main>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: number }).status;
  if (status === 404) return true;
  const message = (error as { message?: string }).message;
  return typeof message === "string" && /not.?found|404|không tồn tại/i.test(message);
}
