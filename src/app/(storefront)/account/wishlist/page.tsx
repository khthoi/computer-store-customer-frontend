import { WishlistPageInner } from "@/src/components/account/wishlist/WishlistPageInner";
import { getMyWishlist } from "@/src/services/wishlist.service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function WishlistPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  const paginated = await getMyWishlist({ page, limit: PAGE_SIZE }).catch(() => ({
    items: [],
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  }));
  return (
    <WishlistPageInner
      initialItems={paginated.items}
      page={paginated.page}
      totalPages={paginated.totalPages}
      total={paginated.total}
    />
  );
}
