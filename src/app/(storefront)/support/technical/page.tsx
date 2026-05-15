import type { Metadata } from "next";
import Link from "next/link";
import { Accordion } from "@computer-store/ui";
import { ROUTES } from "@/src/lib/routes";

export const metadata: Metadata = {
  title: "Hỗ Trợ Kỹ Thuật | TechStore",
  description:
    "Hướng dẫn lắp ráp PC, khắc phục sự cố phần cứng, driver và BIOS. Hỗ trợ kỹ thuật từ đội ngũ chuyên gia TechStore.",
};

const QUICK_LINKS = [
  { icon: "🔧", title: "Lắp ráp PC", description: "Hướng dẫn từng bước lắp ráp máy tính", href: "#lap-rap" },
  { icon: "⚡", title: "Không lên nguồn", description: "Khắc phục PC không khởi động được", href: "#khong-len-nguon" },
  { icon: "🌡️", title: "Nhiệt độ cao", description: "Xử lý CPU/GPU quá nhiệt", href: "#nhiet-do" },
  { icon: "💾", title: "Driver & BIOS", description: "Cập nhật driver và firmware", href: "#driver-bios" },
  { icon: "🖥️", title: "Sự cố màn hình", description: "Không nhận tín hiệu, màn hình đen", href: "#man-hinh" },
  { icon: "🎮", title: "Hiệu năng gaming", description: "Tối ưu FPS và giảm giật lag", href: "#gaming" },
];

const ASSEMBLY_GUIDE = [
  {
    value: "asm-1",
    label: "Thứ tự lắp linh kiện vào case chuẩn là gì?",
    children: (
      <ol className="text-slate-700 text-sm space-y-1.5 list-none">
        {[
          "Lắp CPU vào bo mạch chủ (ngoài case) — chú ý khớp tam giác",
          "Gắn tản nhiệt CPU và bôi keo tản nhiệt",
          "Gắn RAM vào đúng khe (thường khe 2 & 4 cho dual channel)",
          "Lắp bo mạch chủ vào case, xiết vít theo đường chéo",
          "Gắn nguồn vào case, đi dây gọn gàng",
          "Lắp SSD NVMe vào khe M.2 trên mainboard",
          "Lắp GPU vào khe PCIe x16, cắm nguồn 8-pin",
          "Cắm tất cả dây nguồn: 24-pin ATX, 8-pin CPU, SATA...",
          "Kết nối dây panel (power, reset, LED) theo sơ đồ mainboard",
          "Kiểm tra lần cuối trước khi đóng case và khởi động",
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    ),
  },
  {
    value: "asm-2",
    label: "Cách bôi keo tản nhiệt đúng cách?",
    children: (
      <div className="text-slate-700 text-sm space-y-2">
        <p>Có 3 phương pháp phổ biến, tất cả đều cho kết quả tốt nếu làm đúng:</p>
        <ul className="space-y-1">
          <li>• <strong>Chấm giữa (pea method):</strong> nhỏ một chấm cỡ hạt đậu vào trung tâm IHS — phương pháp phổ biến và an toàn nhất</li>
          <li>• <strong>Trải đều (spread method):</strong> dùng thẻ nhựa trải mỏng đều lên toàn bộ bề mặt IHS</li>
          <li>• <strong>Chữ X / chữ thập:</strong> vẽ chữ X hoặc + để phân phối đều hơn với IHS lớn</li>
        </ul>
        <p className="text-slate-500">Không cần quá nhiều keo — lượng keo thừa sẽ tràn ra khi ép tản nhiệt, gây bẩn và không cải thiện nhiệt độ.</p>
      </div>
    ),
  },
  {
    value: "asm-3",
    label: "RAM cắm một thanh hay hai thanh tốt hơn?",
    children: (
      <p className="text-slate-700 text-sm leading-relaxed">
        Hai thanh RAM chạy <strong>dual channel</strong> cho băng thông gấp đôi một thanh, cải thiện
        hiệu năng gaming và render từ 5–20%. Cắm vào khe 2 & 4 (đếm từ CPU) hoặc theo hướng dẫn in
        trên bo mạch chủ. Đảm bảo hai thanh cùng tốc độ và CL — lý tưởng nhất là cùng kit (mua cùng
        lúc từ một bộ).
      </p>
    ),
  },
];

const TROUBLESHOOTING_ITEMS = [
  {
    value: "ts-1",
    label: "PC bật nguồn nhưng không POST (không ra màn hình, beep liên tục)?",
    children: (
      <ul className="text-slate-700 text-sm space-y-1.5">
        <li>• Kiểm tra RAM: rút ra, lau tiếp điểm bằng tẩy, cắm lại chắc tay</li>
        <li>• Thử từng thanh RAM một (cắm vào khe A2 trước)</li>
        <li>• Kiểm tra CPU có cắm đúng và đủ pin không</li>
        <li>• Tháo GPU, chạy thử onboard graphics (nếu CPU có)</li>
        <li>• Kiểm tra dây nguồn 24-pin và 8-pin CPU đã cắm chắc chưa</li>
        <li>• Reset CMOS: rút pin CR2032 khoảng 30 giây hoặc dùng jumper CLR_CMOS</li>
      </ul>
    ),
  },
  {
    value: "ts-2",
    label: "CPU/GPU quá nhiệt, phải làm gì?",
    children: (
      <div className="text-slate-700 text-sm space-y-2" id="nhiet-do">
        <p>Nhiệt độ an toàn: CPU &lt; 85°C, GPU &lt; 90°C khi tải nặng. Nếu vượt ngưỡng:</p>
        <ul className="space-y-1">
          <li>• Kiểm tra tản nhiệt có được lắp chặt không (đặc biệt tản nhiệt Intel push-pin)</li>
          <li>• Thay keo tản nhiệt mới — keo cũ sau 2–3 năm bắt đầu giảm hiệu quả</li>
          <li>• Kiểm tra luồng gió trong case: intake phía trước/dưới, exhaust phía sau/trên</li>
          <li>• Làm sạch bụi trên cánh quạt tản nhiệt và GPU</li>
          <li>• Với CPU Intel: bật XMP/EXPO trong BIOS để tránh chạy RAM ở tốc độ cao không cần thiết</li>
          <li>• Cân nhắc nâng cấp tản nhiệt nếu dùng tản theo hộp với CPU 65W+</li>
        </ul>
      </div>
    ),
  },
  {
    value: "ts-3",
    label: "Màn hình không nhận tín hiệu / hiển thị đen?",
    children: (
      <ul className="text-slate-700 text-sm space-y-1.5" id="man-hinh">
        <li>• Cắm cáp DisplayPort/HDMI vào cổng GPU (card rời), không phải cổng trên bo mạch chủ</li>
        <li>• Thử cáp khác — cáp HDMI rẻ tiền đôi khi không hỗ trợ độ phân giải/tần số cao</li>
        <li>• Kiểm tra màn hình đang ở đúng input source</li>
        <li>• Tắt nguồn, rút cắm GPU ra rồi gắn lại chắc tay, cắm điện 8-pin</li>
        <li>• Thử GPU trên máy khác hoặc thử card khác để xác định lỗi</li>
      </ul>
    ),
  },
  {
    value: "ts-4",
    label: "PC bị restart đột ngột hoặc màn hình xanh (BSOD)?",
    children: (
      <div className="text-slate-700 text-sm space-y-2">
        <p>Nguyên nhân phổ biến:</p>
        <ul className="space-y-1">
          <li>• <strong>RAM lỗi / không tương thích:</strong> chạy MemTest86 qua USB tối thiểu 1 pass</li>
          <li>• <strong>Driver không ổn định:</strong> gỡ driver GPU và cài lại phiên bản mới nhất từ trang chủ</li>
          <li>• <strong>Nguồn yếu / lỗi:</strong> dùng HWInfo64 kiểm tra điện áp — 12V không được thấp hơn 11.4V dưới tải</li>
          <li>• <strong>Xung nhân không ổn định:</strong> nếu đang OC, reset về xung mặc định</li>
          <li>• <strong>Windows bị lỗi:</strong> chạy <code>sfc /scannow</code> và <code>DISM /Online /Cleanup-Image /RestoreHealth</code></li>
        </ul>
      </div>
    ),
  },
];

const DRIVER_ITEMS = [
  {
    value: "drv-1",
    label: "Cài driver theo thứ tự nào sau khi cài Windows?",
    children: (
      <ol className="text-slate-700 text-sm space-y-1.5 list-none">
        {[
          "Chipset driver (Intel/AMD) — nền tảng để các driver khác hoạt động đúng",
          "Driver GPU (NVIDIA GeForce Experience / AMD Radeon Software / Intel Arc)",
          "Driver âm thanh (Realtek / Creative)",
          "Driver mạng (LAN / WiFi)",
          "Driver Bo mạch chủ còn lại (USB, Thunderbolt, ...)",
          "Windows Update để vá bảo mật",
        ].map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    ),
  },
  {
    value: "drv-2",
    label: "Khi nào cần cập nhật BIOS / UEFI?",
    children: (
      <div className="text-slate-700 text-sm space-y-2">
        <p>Nên cập nhật BIOS khi:</p>
        <ul className="space-y-1">
          <li>• Nâng cấp lên thế hệ CPU mới hơn mà board chưa hỗ trợ</li>
          <li>• Bản cập nhật vá lỗi bảo mật quan trọng (Spectre, Meltdown...)</li>
          <li>• Bản cập nhật sửa lỗi stability / POST với combo RAM cụ thể</li>
        </ul>
        <p className="mt-2"><strong>Không nên</strong> cập nhật BIOS nếu hệ thống đang hoạt động ổn định — mỗi lần flash BIOS đều có rủi ro nhỏ. Làm theo đúng hướng dẫn của nhà sản xuất board.</p>
      </div>
    ),
  },
];

const GAMING_ITEMS = [
  {
    value: "gm-1",
    label: "Làm sao bật XMP/EXPO để RAM chạy đúng tốc độ?",
    children: (
      <p className="text-slate-700 text-sm leading-relaxed">
        Vào BIOS (nhấn Del/F2 khi khởi động) → tìm mục <strong>XMP</strong> (Intel) hoặc{" "}
        <strong>EXPO</strong> (AMD) → bật lên và chọn profile phù hợp (thường Profile 1). Save và
        thoát. Kiểm tra lại trong Task Manager → Performance → Memory — tốc độ phải khớp với nhãn
        RAM (ví dụ: DDR5-6000).
      </p>
    ),
  },
  {
    value: "gm-2",
    label: "GPU bị throttle, FPS thấp hơn kỳ vọng?",
    children: (
      <ul className="text-slate-700 text-sm space-y-1.5" id="gaming">
        <li>• Kiểm tra nhiệt độ GPU trong MSI Afterburner — nếu &gt;90°C đang bị thermal throttle</li>
        <li>• Kiểm tra nguồn điện cấp cho GPU: cần đủ công suất, dùng cáp trực tiếp từ nguồn</li>
        <li>• Đảm bảo GPU chạy ở PCIe x16 (kiểm tra trong GPU-Z, ô Bus Interface)</li>
        <li>• Tắt nền ứng dụng ngốn RAM: GPU chia sẻ băng thông với CPU nếu RAM đầy</li>
        <li>• Trong NVIDIA Control Panel / AMD Software: đặt Power Management Mode = Maximum Performance</li>
      </ul>
    ),
  },
];

export default function SupportTechnicalPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-2">
            Hỗ trợ kỹ thuật
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Trung tâm hỗ trợ kỹ thuật</h1>
          <p className="text-slate-600">
            Hướng dẫn lắp ráp, khắc phục sự cố và tối ưu hiệu năng PC của bạn
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {QUICK_LINKS.map((ql) => (
            <a
              key={ql.title}
              href={ql.href}
              className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{ql.icon}</span>
              <p className="text-slate-900 font-medium text-sm mt-2">{ql.title}</p>
              <p className="text-slate-500 text-xs mt-0.5 leading-tight">{ql.description}</p>
            </a>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Assembly */}
            <section id="lap-rap">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Lắp ráp PC
              </h2>
              <Accordion items={ASSEMBLY_GUIDE} variant="bordered" multiple />
            </section>

            {/* Troubleshooting */}
            <section id="khong-len-nguon">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Khắc phục sự cố
              </h2>
              <Accordion items={TROUBLESHOOTING_ITEMS} variant="bordered" multiple />
            </section>

            {/* Driver & BIOS */}
            <section id="driver-bios">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Driver & BIOS
              </h2>
              <Accordion items={DRIVER_ITEMS} variant="bordered" multiple />
            </section>

            {/* Gaming performance */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                Tối ưu hiệu năng gaming
              </h2>
              <Accordion items={GAMING_ITEMS} variant="bordered" multiple />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Contact support */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Cần hỗ trợ trực tiếp?</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Hotline kỹ thuật</p>
                  <p className="text-primary-600 font-bold">1800 6868</p>
                  <p className="text-slate-500 text-xs">Miễn phí · 8:00–22:00 mỗi ngày</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Mở ticket hỗ trợ</p>
                  <Link
                    href={ROUTES.account.support}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Tài khoản → Hỗ trợ →
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Mang máy đến showroom</p>
                  <Link href={ROUTES.contact} className="text-sm text-primary-600 hover:underline">
                    Xem địa chỉ →
                  </Link>
                </div>
              </div>
            </div>

            {/* Related guides */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Tài liệu liên quan</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href={ROUTES.buildPc}
                    className="text-sm text-primary-600 hover:underline flex gap-1.5"
                  >
                    <span>🔩</span> Công cụ Build PC
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.staticPage("chinh-sach-bao-hanh")}
                    className="text-sm text-primary-600 hover:underline flex gap-1.5"
                  >
                    <span>🛡</span> Chính sách bảo hành
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.faq}
                    className="text-sm text-primary-600 hover:underline flex gap-1.5"
                  >
                    <span>❓</span> FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href={ROUTES.staticPage("huong-dan-mua-hang")}
                    className="text-sm text-primary-600 hover:underline flex gap-1.5"
                  >
                    <span>📋</span> Hướng dẫn mua hàng
                  </Link>
                </li>
              </ul>
            </div>

            {/* Pro tip */}
            <div className="bg-warning-50 rounded-xl border border-warning-200 p-4">
              <p className="text-warning-800 text-sm font-semibold mb-1">💡 Mẹo lắp ráp</p>
              <p className="text-warning-700 text-sm">
                Trước khi lắp linh kiện, chạm tay vào vật kim loại tiếp đất để giải phóng tĩnh điện.
                Tĩnh điện là nguyên nhân số 1 gây hỏng linh kiện mà không để lại dấu vết.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
