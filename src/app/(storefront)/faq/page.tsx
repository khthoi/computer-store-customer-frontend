import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/src/lib/routes";
import { getPublicFaq } from "@/src/services/storefront-faq.service";
import { FaqGroupAccordion } from "@/src/components/support/FaqGroupAccordion";

export const metadata: Metadata = {
  title: "Câu Hỏi Thường Gặp (FAQ) | TechStore",
  description:
    "Giải đáp các câu hỏi thường gặp về đặt hàng, thanh toán, giao hàng, bảo hành, đổi trả và tài khoản tại TechStore.",
};

export const revalidate = 1800;

export default async function FaqPage() {
  const groups = await getPublicFaq();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Câu hỏi thường gặp</h1>
      <p className="text-slate-500 text-sm mb-10">
        Không tìm thấy câu trả lời?{" "}
        <Link href={ROUTES.contact} className="text-primary-600 hover:underline">
          Liên hệ chúng tôi
        </Link>
      </p>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-slate-500 text-sm">
            Hiện chưa có câu hỏi nào được công bố. Vui lòng quay lại sau.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.id}>
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
                {group.name}
              </h2>
              {group.description ? (
                <p className="text-slate-500 text-sm mb-4">{group.description}</p>
              ) : null}
              <FaqGroupAccordion items={group.items} />
            </section>
          ))}
        </div>
      )}

      <div className="mt-12 rounded-xl bg-primary-50 border border-primary-100 p-6 text-center">
        <h3 className="font-semibold text-primary-900 mb-2">Vẫn còn thắc mắc?</h3>
        <p className="text-primary-700 text-sm mb-4">
          Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={ROUTES.contact}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Gửi tin nhắn
          </Link>
          <a
            href="tel:18006868"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-primary-300 hover:border-primary-400 bg-white text-primary-700 text-sm font-medium transition-colors"
          >
            Gọi 1800 6868
          </a>
        </div>
      </div>
    </div>
  );
}
