import { InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  getEarnRules,
  getMembershipTiers,
} from "@/src/services/loyalty.service";
import { LoyaltyTiersTable } from "@/src/components/promotions/loyalty/LoyaltyTiersTable";
import { EarnRulesList } from "@/src/components/promotions/loyalty/EarnRulesList";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quy tắc đổi thưởng · PC Store",
  description:
    "Hướng dẫn cách tích điểm, hạng thành viên và quy tắc đổi điểm thưởng tại PC Store.",
};

export default async function RulesPage() {
  const [earnRules, tiers] = await Promise.all([
    getEarnRules(),
    getMembershipTiers(),
  ]);

  return (
    <main className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-secondary-900">
          Quy tắc đổi thưởng
        </h1>
        <p className="mt-1 text-sm text-secondary-500">
          Tổng hợp cách tích điểm, hạng thành viên và các quy tắc khi đổi điểm
          lấy phần thưởng.
        </p>
      </header>

      <EarnRulesList rules={earnRules} />

      <LoyaltyTiersTable tiers={tiers} />

      <section className="rounded-2xl border border-secondary-200 bg-white p-5">
        <header className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-50 text-info-600">
            <InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-secondary-900">
              Quy tắc đổi điểm
            </h2>
            <p className="mt-0.5 text-sm text-secondary-500">
              Áp dụng khi đổi điểm sang mã giảm giá trong mục{" "}
              <strong>Đổi điểm thưởng</strong>.
            </p>
          </div>
        </header>

        <ul className="list-disc space-y-1.5 pl-12 text-sm text-secondary-700">
          <li>
            Điểm chỉ được cộng vào tài khoản khi đơn hàng đã giao thành công và
            qua thời gian đổi/trả.
          </li>
          <li>
            Mỗi điểm có thể đổi sang một mã coupon từ danh sách phần thưởng đang
            mở. Mỗi mã chỉ dùng được một lần và có thời hạn riêng.
          </li>
          <li>
            Điểm sẽ bị trừ ngay khi xác nhận đổi và{" "}
            <strong>không thể hoàn lại</strong> nếu mã đã được sinh ra. Vui lòng
            kiểm tra kỹ trước khi xác nhận.
          </li>
          <li>
            Mã đổi từ điểm không cộng dồn với một số chương trình khuyến mãi
            loại <em>exclusive</em>. Hệ thống sẽ tự kiểm tra ở bước thanh toán.
          </li>
          <li>
            Điểm và mã đổi không được quy đổi thành tiền mặt, không được chuyển
            nhượng cho tài khoản khác.
          </li>
          <li>
            Cửa hàng có quyền điều chỉnh quy tắc tích điểm, hạng thành viên và
            danh sách phần thưởng tại bất kỳ thời điểm nào. Mọi thay đổi sẽ được
            cập nhật trên trang này.
          </li>
        </ul>
      </section>
    </main>
  );
}
