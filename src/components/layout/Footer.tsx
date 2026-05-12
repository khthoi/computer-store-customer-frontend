import Link from "next/link";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaXTwitter, FaYoutube } from "react-icons/fa6";
import type { FooterConfigData, StorefrontMenuItem } from "@/src/types/storefront-layout.types";
import type { ReactNode } from "react";

function FacebookIcon({ className }: { className?: string }) {
  return <FaFacebookF className={className} />;
}

function YouTubeIcon({ className }: { className?: string }) {
  return <FaYoutube className={className} />;
}

function TikTokIcon({ className }: { className?: string }) {
  return <FaTiktok className={className} />;
}

function InstagramIcon({ className }: { className?: string }) {
  return <FaInstagram className={className} />;
}

function TwitterIcon({ className }: { className?: string }) {
  return <FaXTwitter className={className} />;
}

function LinkedinIcon({ className }: { className?: string }) {
  return <FaLinkedinIn className={className} />;
}

const SOCIAL_ICON_MAP = {
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  twitter: TwitterIcon,
  linkedin: LinkedinIcon,
  zalo: FacebookIcon,
} as const;

const PAYMENT_METHODS = [
  { label: "VISA", color: "text-blue-400" },
  { label: "Mastercard", color: "text-orange-400" },
  { label: "MoMo", color: "text-pink-400" },
  { label: "VNPay", color: "text-blue-300" },
  { label: "COD", color: "text-green-400" },
];

function PaymentBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-wide",
        color,
      ].join(" ")}
      aria-label={`Thanh toán qua ${label}`}
    >
      {label}
    </span>
  );
}

function FooterHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/90">
      {children}
    </h3>
  );
}

function FooterLink({ href, target, children }: { href: string; target?: "_self" | "_blank"; children: ReactNode }) {
  const isExternal = href.startsWith("http");
  return (
    <li>
      <Link
        href={href}
        target={target === "_blank" || isExternal ? "_blank" : undefined}
        rel={target === "_blank" || isExternal ? "noopener noreferrer" : undefined}
        className="text-sm text-white/60 transition-colors hover:text-white hover:underline underline-offset-2 decoration-white/30"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterMenuList({ items }: { items: StorefrontMenuItem[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((link) => (
        <FooterLink key={link.id} href={link.url} target={link.target}>
          {link.label}
        </FooterLink>
      ))}
    </ul>
  );
}

export interface FooterProps {
  config: FooterConfigData;
  menus: Record<"footer_column_1" | "footer_column_2" | "footer_column_3", StorefrontMenuItem[]>;
}

export function Footer({ config, menus }: FooterProps) {
  const [columnOne, columnTwo, columnThree] = config.linkColumns;
  const columnOneItems = columnOne ? menus[columnOne.location] : [];
  const columnTwoItems = columnTwo ? menus[columnTwo.location] : [];
  const columnThreeItems = columnThree ? menus[columnThree.location] : [];

  return (
    <footer className="bg-secondary-900 text-secondary-400">
      <div className="mx-auto flex max-w-[1450px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-5 flex items-center gap-2.5 focus-visible:outline-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-extrabold text-white shadow-md">
                PC
              </div>
              <span className="text-base font-extrabold text-white">
                {config.brand.storeName}
              </span>
            </Link>

            <p className="mb-5 text-sm leading-relaxed text-white/60">
              {config.brand.description || "Cửa hàng linh kiện máy tính và laptop chính hãng."}
            </p>

            {(config.contact.phone || config.contact.supportHours) && (
              <div className="mb-5 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/40">
                  Hotline hỗ trợ
                </p>
                {config.contact.phone && (
                  <a
                    href={`tel:${config.contact.phone}`}
                    className="block text-base font-bold text-primary-400 transition-colors hover:text-primary-300"
                  >
                    {config.contact.phone}
                  </a>
                )}
                {config.contact.supportHours && (
                  <p className="mt-0.5 text-xs text-white/50">
                    {config.contact.supportHours}
                  </p>
                )}
              </div>
            )}

            {columnOne && (
              <>
                <FooterHeading>{columnOne.title}</FooterHeading>
                <FooterMenuList items={columnOneItems} />
              </>
            )}
          </div>

          <div>
            {columnTwo && (
              <>
                <FooterHeading>{columnTwo.title}</FooterHeading>
                <FooterMenuList items={columnTwoItems} />
              </>
            )}
          </div>

          <div>
            {columnThree && (
              <>
                <FooterHeading>{columnThree.title}</FooterHeading>
                <FooterMenuList items={columnThreeItems} />
              </>
            )}
          </div>

          <div>
            <FooterHeading>Liên hệ</FooterHeading>

            <address className="mb-6 flex flex-col gap-3.5 text-sm not-italic">
              {config.contact.address && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Địa chỉ</p>
                  <p className="whitespace-pre-line text-white/60">{config.contact.address}</p>
                </div>
              )}
              {config.contact.email && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/40">Email</p>
                  <a
                    href={`mailto:${config.contact.email}`}
                    className="text-white/60 transition-colors hover:text-white"
                  >
                    {config.contact.email}
                  </a>
                </div>
              )}
            </address>

            {config.socialLinks.length > 0 && (
              <>
                <FooterHeading>Theo dõi chúng tôi</FooterHeading>
                <div className="mb-6 flex items-center gap-2.5">
                  {config.socialLinks.map(({ platform, url }) => {
                    const Icon = SOCIAL_ICON_MAP[platform as keyof typeof SOCIAL_ICON_MAP] ?? FacebookIcon;
                    return (
                      <a
                        key={`${platform}-${url}`}
                        href={url}
                        aria-label={platform}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/50 transition-all hover:bg-white/10 hover:text-white"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    );
                  })}
                </div>
              </>
            )}

            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
                Chứng nhận
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] text-white/40">
                <span className="rounded border border-white/15 px-2 py-0.5">DMCA Protected</span>
                <span className="rounded border border-white/15 px-2 py-0.5">SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1450px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="my-auto text-center text-xs text-white/40 sm:text-left">
              {config.copyright}
              {config.bottomLinks.length > 0 && " "}
              {config.bottomLinks.map((link, index) => (
                <span key={`${link.label}-${link.url}`}>
                  {index === 0 ? "" : " · "}
                  <Link href={link.url} className="transition-colors hover:text-white/70">
                    {link.label}
                  </Link>
                </span>
              ))}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Phương thức thanh toán">
              {PAYMENT_METHODS.map(({ label, color }) => (
                <PaymentBadge key={label} label={label} color={color} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
