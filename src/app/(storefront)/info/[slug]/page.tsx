import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPageBySlug,
  getPublishedPages,
} from "@/src/services/cms-page.service";

export const revalidate = 1800;

type PageParams = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const pages = await getPublishedPages();
    return pages.map((p) => ({ slug: p.slug.replace(/^info\//, "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  try {
    const page = await getPageBySlug(slug);
    return {
      title: page.metaTitle ?? page.title,
      description: page.metaDescription ?? undefined,
      keywords: page.metaKeywords ?? undefined,
      openGraph: page.ogImage ? { images: [page.ogImage] } : undefined,
      alternates: page.canonicalUrl
        ? { canonical: page.canonicalUrl }
        : undefined,
      robots: page.noIndex ? { index: false, follow: false } : undefined,
    };
  } catch {
    return { title: "Trang không tồn tại" };
  }
}

export default async function StaticPageRoute({ params }: PageParams) {
  const { slug } = await params;
  let page;
  try {
    page = await getPageBySlug(slug);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) notFound();
    throw err;
  }

  return (
    <article className="bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-slate-900">{page.title}</h1>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <div
          className="
            text-slate-700 leading-relaxed
            [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-8 [&_h1]:mb-4
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3
            [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-6 [&_h3]:mb-2
            [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-slate-900 [&_h4]:mt-4 [&_h4]:mb-2
            [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
            [&_li]:mb-1
            [&_a]:text-primary-600 hover:[&_a]:underline
            [&_strong]:font-semibold [&_strong]:text-slate-900
            [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
            [&_img]:rounded-lg [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto
            [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
            [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
            [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2
            [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-slate-900 [&_pre]:text-slate-50 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
          "
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </article>
  );
}
