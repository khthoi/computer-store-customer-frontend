import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/src/lib/routes";

export const metadata: Metadata = {
  title: "Chính Sách Đổi Trả | TechStore",
  description:
    "Chính sách đổi trả linh hoạt tại TechStore: điều kiện đổi trả, thời hạn, quy trình và các trường hợp được hoàn tiền.",
};

const TOC = [
  { id: "cam-ket", label: "1. Cam kết của TechStore" },
  { id: "doi-hang", label: "2. Điều kiện đổi hàng" },
  { id: "tra-hang", label: "3. Điều kiện trả hàng & hoàn tiền" },
  { id: "khong-ap-dung", label: "4. Trường hợp không áp dụng đổi trả" },
  { id: "thoi-han", label: "5. Thời hạn đổi trả" },
  { id: "quy-trinh", label: "6. Quy trình đổi trả" },
  { id: "hoan-tien", label: "7. Thời gian hoàn tiền" },
  { id: "lien-he", label: "8. Liên hệ đổi trả" },
];

const RETURN_WINDOW_TABLE = [
  { scenario: "Sản phẩm lỗi kỹ thuật do nhà sản xuất", window: "30 ngày", note: "Đổi mới 100%" },
  { scenario: "Sản phẩm giao sai mẫu / màu / model", window: "7 ngày", note: "Đổi đúng sản phẩm hoặc hoàn tiền" },
  { scenario: "Sản phẩm hư hỏng khi vận chuyển", window: "48 giờ từ khi nhận", note: "Đổi mới hoặc hoàn tiền" },
  { scenario: "Thay đổi quyết định mua (hàng nguyên seal)", window: "7 ngày", note: "Áp dụng với điều kiện nghiêm ngặt" },
  { scenario: "Sản phẩm không đúng mô tả", window: "15 ngày", note: "Đổi hoặc hoàn tiền toàn bộ" },
];

const REFUND_METHODS = [
  { method: "Thẻ Visa / Mastercard", time: "5–10 ngày làm việc" },
  { method: "Thẻ ATM / Internet Banking", time: "1–3 ngày làm việc" },
  { method: "Ví điện tử (MoMo, ZaloPay, VNPay)", time: "1–2 ngày làm việc" },
  { method: "Chuyển khoản ngân hàng", time: "1–2 ngày làm việc" },
  { method: "COD (tiền mặt)", time: "1–3 ngày làm việc qua chuyển khoản" },
];

export default function ChinhSachDoiTraPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Chính sách đổi trả</h1>
      <p className="text-slate-500 text-sm mb-10">
        Cập nhật lần cuối: tháng 01/2025 · Áp dụng cho tất cả đơn hàng tại TechStore
      </p>

      {/* ToC */}
      <nav className="mb-10 rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Nội dung</p>
        <ol className="space-y-1.5">
          {TOC.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Section 1 */}
      <section id="cam-ket" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Cam kết của TechStore</h2>
        <p className="text-slate-700 leading-relaxed">
          TechStore cam kết mang đến trải nghiệm mua sắm an toàn và minh bạch. Nếu sản phẩm bạn
          nhận không đúng mô tả, bị lỗi kỹ thuật hoặc hư hỏng trong quá trình vận chuyển, chúng
          tôi sẽ đổi mới hoặc hoàn tiền theo chính sách dưới đây.
        </p>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 2 */}
      <section id="doi-hang" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Điều kiện đổi hàng</h2>
        <ul className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2"><span className="text-success-600 shrink-0">✓</span>Sản phẩm còn trong thời hạn đổi trả (xem bảng mục 5)</li>
          <li className="flex gap-2"><span className="text-success-600 shrink-0">✓</span>Còn đủ phụ kiện, hộp, tài liệu, tem bảo hành đi kèm</li>
          <li className="flex gap-2"><span className="text-success-600 shrink-0">✓</span>Có hoá đơn / xác nhận đơn hàng từ TechStore</li>
          <li className="flex gap-2"><span className="text-success-600 shrink-0">✓</span>Sản phẩm chưa bị can thiệp sửa chữa bởi bên ngoài</li>
          <li className="flex gap-2"><span className="text-success-600 shrink-0">✓</span>Đổi sang sản phẩm cùng loại hoặc tương đương (nếu hết hàng)</li>
        </ul>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 3 */}
      <section id="tra-hang" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Điều kiện trả hàng & hoàn tiền</h2>
        <p className="text-slate-700 mb-3 leading-relaxed">
          Trả hàng và hoàn tiền được áp dụng trong các trường hợp sau:
        </p>
        <ul className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Sản phẩm giao sai mẫu / model so với đơn đặt hàng</li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Sản phẩm không đúng mô tả trên website</li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Sản phẩm bị hư hỏng, trầy xước nghiêm trọng khi nhận</li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Sản phẩm lỗi kỹ thuật không sửa được trong thời hạn cam kết</li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Hết hàng không thể đổi sang sản phẩm tương đương</li>
        </ul>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 4 */}
      <section id="khong-ap-dung" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Trường hợp không áp dụng đổi trả</h2>
        <ul className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Sản phẩm đã qua sử dụng, có dấu hiệu hư hỏng do người dùng</li>
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Hộp/bao bì bị rách, thiếu phụ kiện, tem bảo hành bị xé</li>
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Sản phẩm đã được kích hoạt (phần mềm, key bản quyền)</li>
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Lỗi do người dùng gây ra (cắm sai điện, lắp sai)</li>
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Quá thời hạn đổi trả theo chính sách</li>
          <li className="flex gap-2"><span className="text-error-500 shrink-0">✕</span>Thay đổi ý định với hàng đã mở seal (trừ lỗi kỹ thuật)</li>
        </ul>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 5 — Table */}
      <section id="thoi-han" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Thời hạn đổi trả</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-slate-700 font-semibold px-4 py-3 border border-slate-200">Tình huống</th>
                <th className="text-left text-slate-700 font-semibold px-4 py-3 border border-slate-200">Thời hạn</th>
                <th className="text-left text-slate-700 font-semibold px-4 py-3 border border-slate-200">Hình thức</th>
              </tr>
            </thead>
            <tbody>
              {RETURN_WINDOW_TABLE.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3 border border-slate-200 text-slate-700">{row.scenario}</td>
                  <td className="px-4 py-3 border border-slate-200 text-warning-700 font-semibold">{row.window}</td>
                  <td className="px-4 py-3 border border-slate-200 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 6 */}
      <section id="quy-trinh" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Quy trình đổi trả</h2>
        <ol className="space-y-3 text-slate-700 text-sm">
          {[
            "Liên hệ TechStore qua hotline 1800 6868 hoặc mở yêu cầu tại tài khoản trong thời hạn đổi trả",
            "Cung cấp mã đơn hàng, mô tả vấn đề và hình ảnh/video minh chứng",
            "Đội ngũ xét duyệt trong 1 ngày làm việc — bạn nhận thông báo kết quả qua email/SMS",
            "Gửi sản phẩm về TechStore theo hướng dẫn (TechStore hỗ trợ phí ship chiều về)",
            "Nhận sản phẩm đổi mới hoặc hoàn tiền theo phương thức đã thanh toán",
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 7 — Refund table */}
      <section id="hoan-tien" className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-3">7. Thời gian hoàn tiền</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left text-slate-700 font-semibold px-4 py-3 border border-slate-200">Phương thức thanh toán</th>
                <th className="text-left text-slate-700 font-semibold px-4 py-3 border border-slate-200">Thời gian hoàn tiền</th>
              </tr>
            </thead>
            <tbody>
              {REFUND_METHODS.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  <td className="px-4 py-3 border border-slate-200 text-slate-900 font-medium">{row.method}</td>
                  <td className="px-4 py-3 border border-slate-200 text-slate-600">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-xs mt-3">
          * Thời gian hoàn tiền tính từ khi TechStore xác nhận nhận lại sản phẩm và kiểm tra đạt điều kiện.
        </p>
        <div className="border-t border-slate-200 my-8" />
      </section>

      {/* Section 8 */}
      <section id="lien-he" className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-3">8. Liên hệ đổi trả</h2>
        <ul className="space-y-2 text-slate-700 text-sm">
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Hotline: <strong>1800 6868</strong> (miễn phí, 8:00–22:00 mỗi ngày)</li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Email: <strong>returns@techstore.vn</strong></li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Yêu cầu đổi trả: <Link href={ROUTES.account.returns} className="text-primary-600 hover:underline">Tài khoản → Đơn trả hàng</Link></li>
          <li className="flex gap-2"><span className="text-primary-600 shrink-0">•</span>Xem <Link href={ROUTES.staticPage("chinh-sach-bao-hanh")} className="text-primary-600 hover:underline">Chính sách bảo hành</Link> để biết thêm về quyền lợi bảo hành</li>
        </ul>
      </section>
    </div>
  );
}
