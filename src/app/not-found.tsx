import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/src/lib/routes";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description:
    "Đường dẫn bạn truy cập không tồn tại hoặc đã bị di chuyển. Quay lại trang chủ hoặc khám phá sản phẩm mới nhất.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="bg-slate-50 min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center">
        <div className="relative inline-block mb-8" aria-hidden="true">
          <p className="text-[7rem] sm:text-[9rem] font-bold leading-none tracking-tight text-slate-200 select-none">
            404
          </p>
          <span className="absolute inset-x-0 -bottom-1 mx-auto h-1 w-16 rounded-full bg-primary-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Không tìm thấy trang
        </h1>
        <p className="text-slate-600 leading-relaxed mb-8 max-w-md mx-auto">
          Đường dẫn bạn truy cập không tồn tại, đã được đổi tên hoặc tạm thời gỡ
          bỏ. Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={ROUTES.home}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500"
          >
            Về trang chủ
          </Link>
          <Link
            href={ROUTES.products}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
          >
            Khám phá sản phẩm
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-3">Có thể bạn quan tâm</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 justify-center text-sm">
            <li>
              <Link
                href={ROUTES.promotions}
                className="text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
              >
                Khuyến mãi
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.buildPc}
                className="text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
              >
                Build PC
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.faq}
                className="text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
              >
                Câu hỏi thường gặp
              </Link>
            </li>
            <li>
              <Link
                href={ROUTES.contact}
                className="text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
              >
                Liên hệ
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
