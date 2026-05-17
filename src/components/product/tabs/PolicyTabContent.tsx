import {
  ShieldCheckIcon,
  ArrowPathIcon,
  TruckIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { Accordion } from "@/src/components/ui/Accordion";
import { HiXMark, HiCheck } from "react-icons/hi2";

// ─── Component ────────────────────────────────────────────────────────────────

export function PolicyTabContent() {
  return (
    <Accordion
      multiple
      variant="bordered"
      defaultValue={["warranty"]}
      items={[
        {
          value: "warranty",
          label: "Chính sách bảo hành",
          icon: <ShieldCheckIcon className="w-5 h-5" />,
          children: (
            <ul className="space-y-3 text-sm text-secondary-700">
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Bảo hành chính hãng <strong>24 tháng</strong> từ ngày mua.
              </li>

              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Bảo hành toàn quốc tại trung tâm chính hãng.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hỗ trợ bảo hành 1 đổi 1 trong <strong>30 ngày</strong> đầu nếu lỗi kỹ thuật do nhà sản xuất.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hỗ trợ bảo hành mở rộng, gia hạn thời gian bảo hành khi mua thêm gói bảo hành mở rộng.
              </li>
            </ul>
          ),
        },
        {
          value: "return",
          label: "Chính sách đổi trả",
          icon: <ArrowPathIcon className="w-5 h-5" />,
          children: (
            <ul className="space-y-3 text-sm text-secondary-700">
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Đổi trả trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng.
              </li>

              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Sản phẩm phải còn nguyên vẹn, chưa qua sử dụng, đầy đủ phụ kiện và bao bì.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Lỗi kỹ thuật do nhà sản xuất: đổi mới trong <strong>7 ngày</strong> đầu.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hoàn tiền trong <strong>3–5 ngày</strong> làm việc sau khi xác nhận trả hàng hợp lệ.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Liên hệ <strong>support@computerstore.vn</strong> hoặc hotline để bắt đầu yêu cầu.
              </li>
            </ul>
          ),
        },
        {
          value: "shipping",
          label: "Chính sách vận chuyển",
          icon: <TruckIcon className="w-5 h-5" />,
          children: (
            <ul className="space-y-3 text-sm text-secondary-700">
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Miễn phí vận chuyển cho đơn hàng từ <strong>1.000.000 ₫</strong>.
              </li>

              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Giao hàng nhanh trong vòng <strong>2–4 ngày</strong> làm việc.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hỗ trợ giao hàng tận nơi và lắp đặt tại Hà Nội, TP.HCM và Đà Nẵng.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Cung cấp mã vận đơn để theo dõi đơn hàng trực tuyến.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Liên hệ bộ phận chăm sóc khách hàng nếu có vấn đề về giao hàng.
              </li>
            </ul>
          ),
        },
        {
          value: "payment",
          label: "Phương thức thanh toán",
          icon: <CreditCardIcon className="w-5 h-5" />,
          children: (
            <ul className="space-y-3 text-sm text-secondary-700">
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hỗ trợ thanh toán trực tuyến qua thẻ tín dụng, thẻ ghi nợ, và ví điện tử.
              </li>

              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Thanh toán khi nhận hàng (COD) chỉ áp dụng cho đơn hàng dưới <strong>5.000.000 ₫</strong>.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Hỗ trợ trả góp 0% lãi suất qua các đối tác tài chính.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Mọi giao dịch đều được mã hóa và bảo mật theo tiêu chuẩn ngành.
              </li>
              <li className="relative pl-5 leading-relaxed">
                <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-primary-500" />
                Liên hệ bộ phận hỗ trợ nếu gặp sự cố trong quá trình thanh toán.
              </li>
            </ul>
          ),
        },
      ]}
    />
  );
}
