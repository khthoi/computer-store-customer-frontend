import { CommunityBuildsPageInner } from "@/src/components/community/buildpc/CommunityBuildsPageInner";

export const metadata = {
  title: "Cấu hình PC từ cộng đồng",
  description:
    "Khám phá các bản dựng PC được người dùng khác chia sẻ — xem chi tiết hoặc clone về tài khoản để chỉnh sửa.",
};

// Public list — client-side state heavy, no per-request SSR needed.
export const dynamic = "force-dynamic";

export default function CommunityBuildsPage() {
  return <CommunityBuildsPageInner />;
}
