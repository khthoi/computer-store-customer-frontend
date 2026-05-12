/**
 * TechStore — Homepage
 *
 * The Header and Footer are rendered by layout.tsx (sticky header + site-wide footer).
 * This page provides the storefront homepage body content.
 */

import Link from "next/link";

import { HeroBanner } from "@/src/components/home/HeroBanner";
import { CategorySlider } from "@/src/components/home/CategorySlider";
import { TrustBadges } from "@/src/components/home/TrustBadges";
import type { ProductCardProps } from "@/src/components/product/ProductCard";
import { ProductCarousel } from "@/src/components/product/ProductCarousel";
import { ProductCardSkeleton } from "@/src/components/product/ProductCardSkeleton";
import { getHomeContent } from "@/src/services/storefront-home.service";

type HomeContent = Awaited<ReturnType<typeof getHomeContent>>;

// ─── Mock datasets ─────────────────────────────────────────────────────────────
// Prices are raw VND integers so ProductCard / PriceTag can format them.

type MockProduct = Omit<ProductCardProps, "onAddToCart" | "onCompare" | "onWishlistToggle">;

const LAPTOP_GAMING_PRODUCTS: MockProduct[] = [
  {
    id: "rog-strix-g16-2024",
    name: "Laptop Asus Gaming ROG Strix G615LR-S5289W (U7 255HX/16GB RAM/1TB SSD/16 WQXGA 240hz/RTX 5070Ti 12GB/Win11/Xám)",
    brand: "ASUS",
    href: "/products/rog-strix-g16-2024",
    thumbnail: "/icons/laptop-gaming.png",
    badge: "Hot",
    productCode: "LG01001",
    price: 42_990_000,
    originalPrice: 47_000_000,
    rating: 4.8,
    reviewCount: 124,
    stockStatus: "in-stock",
    variants: [
      {
        key: "ram",
        label: "RAM",
        options: [
          { value: "16gb", label: "16 GB", stock: 10 },
          { value: "32gb", label: "32 GB", stock: 5, priceDelta: "+3.500.000₫" },
        ],
      },
      {
        key: "storage",
        label: "Bộ nhớ",
        options: [
          { value: "1tb", label: "1 TB SSD", stock: 8 },
          { value: "2tb", label: "2 TB SSD", stock: 3, priceDelta: "+2.500.000₫" },
        ],
      },
    ],
  },
  {
    id: "msi-katana-15-b13vgk",
    name: "MSI Katana 15 B13VGK",
    brand: "MSI",
    href: "/products/msi-katana-15-b13vgk",
    thumbnail: "/icons/laptop-gaming.png",
    badge: "Sale",
    productCode: "LG01002",
    price: 27_490_000,
    originalPrice: 30_000_000,
    rating: 4.6,
    reviewCount: 89,
    stockStatus: "in-stock",
    variants: [
      {
        key: "ram",
        label: "RAM",
        options: [
          { value: "16gb", label: "16 GB", stock: 12 },
          { value: "32gb", label: "32 GB", stock: 4, priceDelta: "+3.000.000₫" },
        ],
      },
    ],
  },
  {
    id: "acer-predator-helios-16",
    name: "Acer Predator Helios 16",
    brand: "Acer",
    href: "/products/acer-predator-helios-16",
    thumbnail: "/icons/laptop-gaming.png",
    productCode: "LG01003",
    price: 56_990_000,
    rating: 4.7,
    reviewCount: 56,
    stockStatus: "in-stock",
  },
  {
    id: "lenovo-legion-5-pro-gen9",
    name: "Lenovo Legion 5 Pro Gen 9",
    brand: "Lenovo",
    href: "/products/lenovo-legion-5-pro-gen9",
    thumbnail: "/icons/laptop-gaming.png",
    badge: "New",
    productCode: "LG01004",
    price: 33_990_000,
    originalPrice: 36_500_000,
    rating: 4.7,
    reviewCount: 73,
    stockStatus: "in-stock",
    variants: [
      {
        key: "storage",
        label: "Bộ nhớ",
        options: [
          { value: "512gb", label: "512 GB", stock: 7 },
          { value: "1tb",   label: "1 TB",   stock: 3, priceDelta: "+1.500.000₫" },
        ],
      },
    ],
  },
  {
    id: "hp-omen-16-2024",
    name: "HP OMEN 16 (2024)",
    brand: "HP",
    href: "/products/hp-omen-16-2024",
    thumbnail: "/icons/laptop-gaming.png",
    productCode: "LG01005",
    price: 31_490_000,
    rating: 4.5,
    reviewCount: 41,
    stockStatus: "low-stock",
    stockQuantity: 3,
  },
  {
    id: "dell-alienware-x15-r2",
    name: "Dell Alienware x15 R2",
    brand: "Dell",
    href: "/products/dell-alienware-x15-r2",
    thumbnail: "/icons/laptop-gaming.png",
    badge: "Hot",
    productCode: "LG01006",
    price: 48_990_000,
    originalPrice: 55_000_000,
    rating: 4.8,
    reviewCount: 67,
    stockStatus: "in-stock",
    stockQuantity: 6,
  }
];

const CPU_PRODUCTS: MockProduct[] = [
  {
    id: "intel-core-i7-14700k",
    name: "Intel Core i7-14700K",
    brand: "Intel",
    href: "/products/intel-core-i7-14700k",
    thumbnail: "/icons/cpu-intel.png",
    badge: "Hot",
    productCode: "CPU02001",
    price: 11_490_000,
    originalPrice: 12_500_000,
    rating: 4.9,
    reviewCount: 312,
    stockStatus: "in-stock",
    variants: [
      {
        key: "bundle",
        label: "Gói",
        options: [
          { value: "cpu-only",    label: "CPU only",         stock: 20 },
          { value: "with-cooler", label: "+ Tản nhiệt",      stock: 8,  priceDelta: "+890.000₫" },
          { value: "with-board",  label: "+ Mainboard Z790", stock: 4,  priceDelta: "+4.500.000₫" },
        ],
      },
    ],
  },
  {
    id: "amd-ryzen-7-7800x3d",
    name: "AMD Ryzen 7 7800X3D",
    brand: "AMD",
    href: "/products/amd-ryzen-7-7800x3d",
    thumbnail: "/icons/cpu-amd.jpg",
    productCode: "CPU02002",
    price: 10_990_000,
    rating: 4.9,
    reviewCount: 278,
    stockStatus: "in-stock",
  },
  {
    id: "intel-core-i9-14900ks",
    name: "Intel Core i9-14900KS",
    brand: "Intel",
    href: "/products/intel-core-i9-14900ks",
    thumbnail: "/icons/cpu-intel.png",
    badge: "New",
    productCode: "CPU02003",
    price: 17_990_000,
    rating: 4.8,
    reviewCount: 64,
    stockStatus: "in-stock",
  },
  {
    id: "amd-ryzen-5-7600x",
    name: "AMD Ryzen 5 7600X",
    brand: "AMD",
    href: "/products/amd-ryzen-5-7600x",
    thumbnail: "/icons/cpu-amd.jpg",
    productCode: "CPU02004",
    price: 5_490_000,
    originalPrice: 6_200_000,
    rating: 4.7,
    reviewCount: 201,
    stockStatus: "in-stock",
  },
  {
    id: "intel-core-i5-14600k",
    name: "Intel Core i5-14600K",
    brand: "Intel",
    href: "/products/intel-core-i5-14600k",
    thumbnail: "/icons/cpu-intel.png",
    badge: "Sale",
    productCode: "CPU02005",
    price: 7_290_000,
    originalPrice: 8_000_000,
    rating: 4.8,
    reviewCount: 445,
    stockStatus: "in-stock",
  },
  {
    id: "amd-ryzen-9-7950x3d",
    name: "AMD Ryzen 9 7950X3D",
    brand: "AMD",
    href: "/products/amd-ryzen-9-7950x3d",
    thumbnail: "/icons/cpu-amd.jpg",
    productCode: "CPU02006",
    price: 24_990_000,
    rating: 5.0,
    reviewCount: 97,
    stockStatus: "in-stock",
  },
  {
    id: "intel-core-i7-13700k",
    name: "Intel Core i7-13700K",
    brand: "Intel",
    href: "/products/intel-core-i7-13700k",
    thumbnail: "/icons/cpu-intel.png",
    badge: "Sale",
    productCode: "CPU02007",
    price: 8_490_000,
    originalPrice: 10_200_000,
    rating: 4.8,
    reviewCount: 523,
    stockStatus: "in-stock",
  },
  {
    id: "amd-ryzen-7-5800x3d",
    name: "AMD Ryzen 7 5800X3D",
    brand: "AMD",
    href: "/products/amd-ryzen-7-5800x3d",
    thumbnail: "/icons/cpu-amd.jpg",
    productCode: "CPU02008",
    price: 6_490_000,
    rating: 4.9,
    reviewCount: 389,
    stockStatus: "low-stock",
    stockQuantity: 4,
  },
];

const GPU_PRODUCTS: MockProduct[] = [
  {
    id: "nvidia-rtx-4070-super",
    name: "NVIDIA GeForce RTX 4070 Super",
    brand: "NVIDIA",
    href: "/products/nvidia-rtx-4070-super",
    thumbnail: "/icons/nvidia.png",
    badge: "Sale",
    productCode: "GPU03001",
    price: 18_990_000,
    originalPrice: 21_000_000,
    rating: 4.8,
    reviewCount: 195,
    stockStatus: "in-stock",
    variants: [
      {
        key: "model",
        label: "Model",
        options: [
          { value: "msi",      label: "MSI Gaming X",  stock: 6 },
          { value: "asus",     label: "ASUS TUF OC",   stock: 4, priceDelta: "+400.000₫" },
          { value: "gigabyte", label: "Gigabyte OC",   stock: 3 },
        ],
      },
    ],
  },
  {
    id: "amd-radeon-rx-7900-xtx",
    name: "AMD Radeon RX 7900 XTX",
    brand: "AMD",
    href: "/products/amd-radeon-rx-7900-xtx",
    thumbnail: "/icons/amd.png",
    productCode: "GPU03002",
    price: 22_490_000,
    rating: 4.7,
    reviewCount: 88,
    stockStatus: "in-stock",
  },
  {
    id: "nvidia-rtx-4080-super",
    name: "NVIDIA GeForce RTX 4080 Super",
    brand: "NVIDIA",
    href: "/products/nvidia-rtx-4080-super",
    thumbnail: "/icons/nvidia.png",
    badge: "New",
    productCode: "GPU03003",
    price: 29_990_000,
    rating: 4.9,
    reviewCount: 142,
    stockStatus: "in-stock",
  },
  {
    id: "amd-radeon-rx-7800-xt",
    name: "AMD Radeon RX 7800 XT",
    brand: "AMD",
    href: "/products/amd-radeon-rx-7800-xt",
    thumbnail: "/icons/amd.png",
    badge: "Sale",
    productCode: "GPU03004",
    price: 11_490_000,
    originalPrice: 13_000_000,
    rating: 4.6,
    reviewCount: 217,
    stockStatus: "in-stock",
  },
  {
    id: "nvidia-rtx-4060-ti",
    name: "NVIDIA GeForce RTX 4060 Ti",
    brand: "NVIDIA",
    href: "/products/nvidia-rtx-4060-ti",
    thumbnail: "/icons/nvidia.png",
    productCode: "GPU03005",
    price: 10_990_000,
    rating: 4.7,
    reviewCount: 304,
    stockStatus: "in-stock",
  },
  {
    id: "nvidia-rtx-4090",
    name: "NVIDIA GeForce RTX 4090",
    brand: "NVIDIA",
    href: "/products/nvidia-rtx-4090",
    thumbnail: "/icons/nvidia.png",
    badge: "Hot",
    productCode: "GPU03006",
    price: 59_990_000,
    rating: 5.0,
    reviewCount: 76,
    stockStatus: "out-of-stock",
    stockQuantity: 0,
  },
  {
    id: "amd-radeon-rx-7600",
    name: "AMD Radeon RX 7600",
    brand: "AMD",
    href: "/products/amd-radeon-rx-7600",
    thumbnail: "/icons/amd.png",
    badge: "Sale",
    productCode: "GPU03007",
    price: 6_490_000,
    originalPrice: 7_200_000,
    rating: 4.5,
    reviewCount: 178,
    stockStatus: "in-stock",
  },
  {
    id: "nvidia-rtx-4070-ti-super",
    name: "NVIDIA GeForce RTX 4070 Ti Super",
    brand: "NVIDIA",
    href: "/products/nvidia-rtx-4070-ti-super",
    thumbnail: "/icons/nvidia.png",
    productCode: "GPU03008",
    price: 23_990_000,
    originalPrice: 25_500_000,
    rating: 4.8,
    reviewCount: 113,
    stockStatus: "low-stock",
    stockQuantity: 5,
  },
];

const PC_GAMING_LOWEND_PRODUCTS: MockProduct[] = [
  {
    id: "pc-gaming-le-01",
    name: "PC Gaming Intel Core i3-12100F + GTX 1660 Super",
    brand: "TechStore",
    href: "/products/pc-gaming-le-01",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE01",
    price: 10_990_000,
    originalPrice: 12_000_000,
    badge: "Sale",
    rating: 4.4,
    reviewCount: 67,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-02",
    name: "PC Gaming AMD Ryzen 3 4100 + RX 6500 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-le-02",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE02",
    price: 9_490_000,
    rating: 4.3,
    reviewCount: 45,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-03",
    name: "PC Gaming Intel Core i3-13100F + GTX 1650 Super",
    brand: "TechStore",
    href: "/products/pc-gaming-le-03",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE03",
    price: 9_990_000,
    rating: 4.4,
    reviewCount: 38,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-04",
    name: "PC Gaming AMD Ryzen 5 5500 + RX 6600",
    brand: "TechStore",
    href: "/products/pc-gaming-le-04",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE04",
    price: 12_490_000,
    originalPrice: 13_500_000,
    badge: "Hot",
    rating: 4.6,
    reviewCount: 91,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-05",
    name: "PC Gaming Intel Core i5-12400 + GTX 1660 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-le-05",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE05",
    price: 11_490_000,
    rating: 4.5,
    reviewCount: 56,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-06",
    name: "PC Gaming AMD Ryzen 3 3300X + RX 5600 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-le-06",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE06",
    price: 8_990_000,
    originalPrice: 9_800_000,
    badge: "Sale",
    rating: 4.2,
    reviewCount: 34,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-07",
    name: "PC Gaming Intel Core i3-12100F + RTX 3060",
    brand: "TechStore",
    href: "/products/pc-gaming-le-07",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE07",
    price: 13_490_000,
    rating: 4.5,
    reviewCount: 112,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-le-08",
    name: "PC Gaming AMD Ryzen 5 4500 + RX 6600 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-le-08",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-LE08",
    price: 12_990_000,
    originalPrice: 14_200_000,
    rating: 4.4,
    reviewCount: 79,
    stockStatus: "in-stock",
  },
];

const PC_GAMING_MIDEND_PRODUCTS: MockProduct[] = [
  {
    id: "pc-gaming-me-01",
    name: "PC Gaming Intel Core i5-14600K + RTX 4060",
    brand: "TechStore",
    href: "/products/pc-gaming-me-01",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Hot",
    productCode: "PCG-ME01",
    price: 21_990_000,
    originalPrice: 24_000_000,
    rating: 4.7,
    reviewCount: 134,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-02",
    name: "PC Gaming AMD Ryzen 5 7600X + RX 7700 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-me-02",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-ME02",
    price: 22_990_000,
    rating: 4.6,
    reviewCount: 88,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-03",
    name: "PC Gaming Intel Core i5-13600K + RTX 4060 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-me-03",
    thumbnail: "/icons/desktop-pc.png",
    badge: "New",
    productCode: "PCG-ME03",
    price: 24_990_000,
    rating: 4.7,
    reviewCount: 61,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-04",
    name: "PC Gaming AMD Ryzen 5 7600 + RX 7800 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-me-04",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Sale",
    productCode: "PCG-ME04",
    price: 23_490_000,
    originalPrice: 26_000_000,
    rating: 4.6,
    reviewCount: 75,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-05",
    name: "PC Gaming Intel Core i7-13700 + RTX 4060",
    brand: "TechStore",
    href: "/products/pc-gaming-me-05",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-ME05",
    price: 24_490_000,
    rating: 4.7,
    reviewCount: 99,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-06",
    name: "PC Gaming AMD Ryzen 7 5700X + RX 6750 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-me-06",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Sale",
    productCode: "PCG-ME06",
    price: 19_990_000,
    originalPrice: 22_000_000,
    rating: 4.5,
    reviewCount: 143,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-07",
    name: "PC Gaming Intel Core i5-14600K + RX 7800 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-me-07",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-ME07",
    price: 25_490_000,
    rating: 4.8,
    reviewCount: 57,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-me-08",
    name: "PC Gaming AMD Ryzen 7 7700 + RTX 4060 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-me-08",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-ME08",
    price: 27_490_000,
    originalPrice: 29_500_000,
    rating: 4.7,
    reviewCount: 46,
    stockStatus: "low-stock",
    stockQuantity: 6,
  },
];

const PC_GAMING_HIGHEND_PRODUCTS: MockProduct[] = [
  {
    id: "pc-gaming-he-01",
    name: "PC Gaming Intel Core i7-14700K + RTX 4070 Super",
    brand: "TechStore",
    href: "/products/pc-gaming-he-01",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Hot",
    productCode: "PCG-HE01",
    price: 39_990_000,
    originalPrice: 44_000_000,
    rating: 4.8,
    reviewCount: 112,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-02",
    name: "PC Gaming AMD Ryzen 7 7800X3D + RX 7900 GRE",
    brand: "TechStore",
    href: "/products/pc-gaming-he-02",
    thumbnail: "/icons/desktop-pc.png",
    badge: "New",
    productCode: "PCG-HE02",
    price: 37_490_000,
    rating: 4.9,
    reviewCount: 84,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-03",
    name: "PC Gaming Intel Core i9-14900K + RTX 4070",
    brand: "TechStore",
    href: "/products/pc-gaming-he-03",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-HE03",
    price: 42_990_000,
    rating: 4.8,
    reviewCount: 67,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-04",
    name: "PC Gaming AMD Ryzen 9 7900X + RX 7900 XT",
    brand: "TechStore",
    href: "/products/pc-gaming-he-04",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Sale",
    productCode: "PCG-HE04",
    price: 44_990_000,
    originalPrice: 49_000_000,
    rating: 4.7,
    reviewCount: 53,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-05",
    name: "PC Gaming Intel Core i7-14700K + RTX 4070 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-he-05",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-HE05",
    price: 47_990_000,
    rating: 4.9,
    reviewCount: 41,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-06",
    name: "PC Gaming AMD Ryzen 7 7800X3D + RTX 4070 Super",
    brand: "TechStore",
    href: "/products/pc-gaming-he-06",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Hot",
    productCode: "PCG-HE06",
    price: 43_490_000,
    originalPrice: 47_000_000,
    rating: 4.9,
    reviewCount: 98,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-07",
    name: "PC Gaming Intel Core i9-13900K + RTX 4070 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-he-07",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Sale",
    productCode: "PCG-HE07",
    price: 49_990_000,
    originalPrice: 55_000_000,
    rating: 4.8,
    reviewCount: 36,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-he-08",
    name: "PC Gaming AMD Ryzen 9 7950X3D + RX 7900 XTX",
    brand: "TechStore",
    href: "/products/pc-gaming-he-08",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-HE08",
    price: 54_990_000,
    rating: 5.0,
    reviewCount: 29,
    stockStatus: "low-stock",
    stockQuantity: 3,
  },
];

const PC_GAMING_MAX_PRODUCTS: MockProduct[] = [
  {
    id: "pc-gaming-max-01",
    name: "PC Gaming Intel Core i9-14900KS + RTX 4090",
    brand: "TechStore",
    href: "/products/pc-gaming-max-01",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Hot",
    productCode: "PCG-MAX01",
    price: 89_990_000,
    originalPrice: 99_000_000,
    rating: 5.0,
    reviewCount: 47,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-02",
    name: "PC Gaming AMD Ryzen 9 7950X3D + RTX 4090",
    brand: "TechStore",
    href: "/products/pc-gaming-max-02",
    thumbnail: "/icons/desktop-pc.png",
    badge: "New",
    productCode: "PCG-MAX02",
    price: 94_990_000,
    rating: 5.0,
    reviewCount: 31,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-03",
    name: "PC Gaming Intel Core i9-14900KF + RTX 4090 OC",
    brand: "TechStore",
    href: "/products/pc-gaming-max-03",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-MAX03",
    price: 99_990_000,
    rating: 5.0,
    reviewCount: 22,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-04",
    name: "PC Gaming AMD Threadripper 7960X + RTX 4090",
    brand: "TechStore",
    href: "/products/pc-gaming-max-04",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Hot",
    productCode: "PCG-MAX04",
    price: 149_990_000,
    originalPrice: 165_000_000,
    rating: 5.0,
    reviewCount: 14,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-05",
    name: "PC Gaming Intel Core i9-14900KS + RTX 4090 Ti",
    brand: "TechStore",
    href: "/products/pc-gaming-max-05",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-MAX05",
    price: 109_990_000,
    rating: 5.0,
    reviewCount: 19,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-06",
    name: "PC Gaming AMD Ryzen 9 7900X3D + RTX 4090",
    brand: "TechStore",
    href: "/products/pc-gaming-max-06",
    thumbnail: "/icons/desktop-pc.png",
    badge: "Sale",
    productCode: "PCG-MAX06",
    price: 84_990_000,
    originalPrice: 94_000_000,
    rating: 4.9,
    reviewCount: 38,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-07",
    name: "PC Gaming Intel Core i9-14900K + RTX 4090 Liquid",
    brand: "TechStore",
    href: "/products/pc-gaming-max-07",
    thumbnail: "/icons/desktop-pc.png",
    productCode: "PCG-MAX07",
    price: 104_990_000,
    rating: 5.0,
    reviewCount: 16,
    stockStatus: "in-stock",
  },
  {
    id: "pc-gaming-max-08",
    name: "PC Gaming AMD Ryzen 9 7950X3D + RX 7900 XTX Dual",
    brand: "TechStore",
    href: "/products/pc-gaming-max-08",
    thumbnail: "/icons/desktop-pc.png",
    badge: "New",
    productCode: "PCG-MAX08",
    price: 119_990_000,
    rating: 5.0,
    reviewCount: 11,
    stockStatus: "low-stock",
    stockQuantity: 2,
  },
];

// ─── Product section ──────────────────────────────────────────────────────────

function ProductSection({
  title,
  href = "/products",
  products,
}: {
  title: string;
  href?: string;
  products: MockProduct[];
}) {
  return (
    <section aria-labelledby={`ps-${title}`} className="py-6 bg-secondary-50 max-w-[1400px] mx-auto flex items-center">
      <div className="w-full 2xl:max-w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="mb-5 flex items-center justify-between">
          <h2 id={`ps-${title}`} className="text-lg font-bold text-secondary-900">
            {title}
          </h2>
          <Link
            href={href}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Xem tất cả →
          </Link>
        </div>
        <ProductCarousel products={products} />
      </div>
    </section>
  );
}

// ─── Flash sale section — skeleton placeholder ────────────────────────────────

function FlashSaleSection() {
  return (
    <section aria-labelledby="ps-flash" className="py-6 bg-secondary-50 max-w-[1400px] mx-auto flex items-center">
      <div className="w-full 2xl:max-w-full px-4 sm:px-6 lg:px-8 2xl:px-0">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="ps-flash" className="text-lg font-bold text-secondary-900">
            Flash Sale — Giảm đến 20% 🔥
          </h2>
          <Link
            href="/khuyen-mai"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Xem tất cả →
          </Link>
        </div>
        <ProductCardSkeleton itemsPerView={6} />
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const homeContent: HomeContent = await getHomeContent();
  const heroBanner = homeContent.banners.hero[0] ?? homeContent.banners.heroSlider[0] ?? null;

  return (
    <>
      <HeroBanner hero={heroBanner} heroSlides={homeContent.banners.heroSlider} smallPromos={homeContent.banners.smallPromo} />
      <TrustBadges badges={homeContent.trustBadges} />
      <CategorySlider items={homeContent.categoryShortcuts} />
      <FlashSaleSection />
      <ProductSection
        title="Laptop Gaming Mới Nhất"
        href="/products/laptop-gaming"
        products={LAPTOP_GAMING_PRODUCTS}
      />
      <ProductSection
        title="CPU Bán Chạy"
        href="/products/cpu"
        products={CPU_PRODUCTS}
      />
      <ProductSection
        title="GPU Bán Chạy"
        href="/products/gpu"
        products={GPU_PRODUCTS}
      />
      <ProductSection
        title="PC Gaming Low-end"
        href="/products/pc-gaming?tier=low"
        products={PC_GAMING_LOWEND_PRODUCTS}
      />
      <ProductSection
        title="PC Gaming Mid-end"
        href="/products/pc-gaming?tier=mid"
        products={PC_GAMING_MIDEND_PRODUCTS}
      />
      <ProductSection
        title="PC Gaming High-end"
        href="/products/pc-gaming?tier=high"
        products={PC_GAMING_HIGHEND_PRODUCTS}
      />
      <ProductSection
        title="PC Gaming Maximum"
        href="/products/pc-gaming?tier=max"
        products={PC_GAMING_MAX_PRODUCTS}
      />
    </>
  );
}


