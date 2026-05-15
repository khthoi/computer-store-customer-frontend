import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hanoicomputercdn.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "product.hstatic.net" },
      { protocol: "https", hostname: "www.androidauthority.com" },
      { protocol: "https", hostname: "www.keychron.com" },
      { protocol: "https", hostname: "www.lg.com" },
      { protocol: "https", hostname: "cdn-files.hacom.vn" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "microless.com" },
      { protocol: "https", hostname: "cdn2.cellphones.com.vn" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "hacom.vn" },
      { protocol: "https", hostname: "kccshop.vn" },
      { protocol: "https", hostname: "cdn.tgdd.vn" },
      { protocol: "https", hostname: "cdn.cellphones.com.vn" },
      { protocol: "https", hostname: "www.amd.com" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    qualities: [70, 75, 90],
    deviceSizes: [64, 128, 256, 384, 640],
    imageSizes: [64, 96, 128, 256],
  },
  async redirects() {
    return [
      { source: "/about", destination: "/info/about", permanent: true },
      { source: "/terms", destination: "/info/terms", permanent: true },
      { source: "/careers", destination: "/info/careers", permanent: true },
      {
        source: "/huong-dan-mua-hang",
        destination: "/info/huong-dan-mua-hang",
        permanent: true,
      },
      {
        source: "/chinh-sach-bao-hanh",
        destination: "/info/chinh-sach-bao-hanh",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;