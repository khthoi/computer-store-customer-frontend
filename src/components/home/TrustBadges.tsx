import {
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon,
  CreditCardIcon,
  GiftIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";
import type { StorefrontTrustBadge } from "@/src/types/storefront-home.types";

const ICON_MAP = {
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PhoneIcon,
  CreditCardIcon,
  GiftIcon,
  StarIcon,
  CheckBadgeIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  LockClosedIcon,
} as const;

export interface TrustBadgesProps {
  badges: StorefrontTrustBadge[];
}

export function TrustBadges({ badges }: TrustBadgesProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Cam kết dịch vụ"
      className="max-w-[1400px] flex mx-auto items-center"
    >
      <div className="w-full 2xl:max-w-full px-4 sm:px-6 lg:px-8 2xl:px-0 py-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-secondary-100">
          {badges.map((badge) => {
            const Icon = ICON_MAP[badge.icon] ?? ShieldCheckIcon;

            return (
              <div
                key={badge.id}
                className="flex items-center gap-3 px-4 py-4 sm:px-6 sm:py-5"
              >
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-secondary-900 sm:text-sm">
                    {badge.title}
                  </p>
                  {badge.subtitle && (
                    <p className="hidden truncate text-xs text-secondary-500 sm:block">
                      {badge.subtitle}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
