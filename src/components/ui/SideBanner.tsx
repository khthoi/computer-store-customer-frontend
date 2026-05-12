import Image from "next/image";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SideBannerProps {
  /** Absolute path from /public, e.g. "/side-banner/side-banner1.jpg" */
  image: string;
  /** Alt text for accessibility */
  alt: string;
  /** Destination URL when clicked */
  href?: string;
  /** Link target */
  target?: "_self" | "_blank";
  /** px width of the banner image — default 160 */
  width?: number;
  /** px height of the banner image — default 480 */
  height?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SideBanner — a vertical promotional banner intended for the sides of the page.
 *
 * Usage:
 * ```tsx
 * <SideBanner
 *   image="/banners/side-left.jpg"
 *   alt="Flash sale tháng 3"
 *   href="/khuyen-mai"
 * />
 * ```
 *
 * Place images at `public/banners/side-left.jpg` and `public/banners/side-right.jpg`
 * (or any path you pass via the `image` prop).
 */
export function SideBanner({
  image,
  alt,
  href = "/",
  target = "_self",
  width = 200,
  height = 720,
}: SideBannerProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      aria-label={alt}
      className="block overflow-hidden rounded-sm shadow-lg transition-transform duration-300 ease-out hover:scale-[1.03]"
      style={{ width }}
    >
      <div
        className="relative shrink-0 bg-secondary-100"
        style={{ width, height }}
      >
        <Image
          src={image}
          alt={alt}
          fill
          sizes="800px"
          quality={75}
          className="object-cover"
          draggable={false}
        />
      </div>
    </Link>
  );
}
