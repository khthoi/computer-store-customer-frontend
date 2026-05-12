import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/src/components/layout/Footer";
import { MainContent } from "@/src/components/layout/MainContent";
import { SideBannersConditional } from "@/src/components/layout/SideBannersConditional";
import { ConnectedHeader } from "@/src/components/layout/ConnectedHeader";
import { Providers } from "./providers";
import { getStorefrontLayoutData } from "@/src/services/storefront-layout.service";

/**
 * CUSTOMER STOREFRONT — Root Layout
 *
 * Font strategy:
 *   Inter           → --font-inter  → picked up by --font-sans in globals.css
 *   JetBrains Mono  → --font-jetbrains-mono → picked up by --font-mono
 *
 * Both fonts are subset to latin and optimized via Next.js font system
 * (zero layout shift, self-hosted on the same origin).
 */

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  // Load weight variants needed by the design system
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  // Weights used for spec labels, SKUs, monospace code
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | TechStore",
    default: "TechStore — Linh Kiện Máy Tính Chính Hãng",
  },
  description:
    "Mua CPU, GPU, RAM, SSD, laptop gaming và linh kiện máy tính chính hãng. Giao hàng toàn quốc, bảo hành 24 tháng.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const layoutData = await getStorefrontLayoutData();

  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-secondary-50">
        <Providers>
          {/* ConnectedHeader reads from AuthProvider + CartProvider context */}
          <ConnectedHeader layoutData={layoutData} />

          {/*
           * 3-column grid at 2xl+ (≥ 1536 px):
           *   [240px side banner] [1fr main content] [240px side banner]
           */}
          <div className="2xl:grid 2xl:grid-cols-[120px_1fr_120px]">
            <SideBannersConditional banners={layoutData.sideBanners} />

            <MainContent>{children}</MainContent>
          </div>

          <Footer config={layoutData.footerConfig} menus={layoutData.footerMenus} />
        </Providers>
      </body>
    </html>
  );
}
