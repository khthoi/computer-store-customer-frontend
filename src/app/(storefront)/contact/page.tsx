import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "./_components/ContactForm";

export const metadata: Metadata = {
  title: "Liên hệ | TechStore",
  description:
    "Liên hệ với TechStore để được tư vấn sản phẩm, hỗ trợ đơn hàng và bảo hành.",
};

const OFFICES = [
  {
    city: "Hà Nội (Trụ sở chính)",
    address: "123 Đường Cầu Giấy, Phường Dịch Vọng Hậu, Quận Cầu Giấy",
    phone: "(024) 3xxx xxxx",
    hours: "T2–CN: 8:00–21:00",
  },
  {
    city: "TP. Hồ Chí Minh",
    address: "456 Đường Nguyễn Thị Minh Khai, Phường 5, Quận 3",
    phone: "(028) 3xxx xxxx",
    hours: "T2–CN: 8:00–21:00",
  },
  {
    city: "Đà Nẵng",
    address: "789 Đường Nguyễn Văn Linh, Quận Hải Châu",
    phone: "(0236) 3xxx xxxx",
    hours: "T2–CN: 8:00–21:00",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-secondary-900 mb-1">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-sm text-secondary-600">
            Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong vòng 1–2 giờ làm việc.
          </p>
        </header>

        <section className="rounded-lg border border-secondary-200 p-6 md:p-8">
          <Suspense
            fallback={<div className="h-64 animate-pulse bg-secondary-100 rounded" />}
          >
            <ContactForm />
          </Suspense>
        </section>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-secondary-900 mb-3">
            Địa chỉ showroom
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {OFFICES.map((o) => (
              <div
                key={o.city}
                className="rounded-lg border border-secondary-200 p-4"
              >
                <p className="font-medium text-secondary-900 mb-1">{o.city}</p>
                <p className="text-sm text-secondary-600 mb-1">{o.address}</p>
                <p className="text-sm text-secondary-600 mb-1">
                  Điện thoại: {o.phone}
                </p>
                <p className="text-sm text-secondary-500">{o.hours}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
