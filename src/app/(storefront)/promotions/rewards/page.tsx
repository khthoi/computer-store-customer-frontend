import Link from "next/link";
import { getRedemptionCatalog } from "@/src/services/loyalty.service";
import { RewardCatalog } from "@/src/components/promotions/loyalty/RewardCatalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Đổi điểm thưởng · PC Store",
  description:
    "Đổi điểm tích lũy lấy mã giảm giá và phần thưởng độc quyền tại PC Store.",
};

export default async function RewardsPage() {
  const rewards = await getRedemptionCatalog();

  return (
    <main className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900">
          Đổi điểm thưởng
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          Dùng điểm tích lũy để đổi mã giảm giá. Mã sau khi đổi có hạn sử dụng
          và không thể quy đổi thành tiền mặt.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-secondary-200 bg-white p-5">
        <h2 className="text-base font-semibold text-secondary-900">
          Quy tắc tích &amp; sử dụng điểm
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-secondary-700">
          <li>
            Tích điểm cho mỗi đơn hàng đã giao thành công. Tỷ lệ quy đổi và mức
            điểm cụ thể được áp dụng theo cấu hình hiện hành của cửa hàng.
          </li>
          <li>
            Điểm có thể đổi sang mã coupon từ danh sách bên dưới. Mỗi mã chỉ
            dùng được một lần và có thời hạn sử dụng riêng.
          </li>
          <li>
            Điểm sẽ bị trừ ngay khi đổi và không thể hoàn lại nếu mã đã được
            sinh ra. Vui lòng kiểm tra kỹ trước khi xác nhận.
          </li>
          <li>
            Mã đổi điểm không cộng dồn với một số chương trình khuyến mãi loại
            &quot;exclusive&quot;. Hệ thống sẽ tự kiểm tra ở bước thanh toán.
          </li>
        </ul>
        <p className="mt-3 text-xs text-secondary-500">
          Xem đầy đủ{" "}
          <Link
            href="/promotions/rules"
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            quy tắc tích &amp; đổi điểm
          </Link>{" "}
          và hạng thành viên.
        </p>
      </section>

      <RewardCatalog rewards={rewards} />
    </main>
  );
}
