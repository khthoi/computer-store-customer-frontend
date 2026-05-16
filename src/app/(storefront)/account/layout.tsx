import type { ReactNode } from "react";
import { AccountSidebar } from "@/src/components/account/AccountSidebar";
import { getMyProfile } from "@/src/services/account-profile.service";
import { getPointsData } from "@/src/services/account-loyalty.service";

export const dynamic = "force-dynamic";

interface AccountLayoutProps {
  children: ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const [profile, points] = await Promise.all([
    getMyProfile().catch(() => null),
    getPointsData().catch(() => null),
  ]);

  const userName = profile?.fullName?.trim() || "Khách hàng";
  const tierLabel = points ? `Thành viên ${points.tier}` : "Thành viên";
  const avatarSrc = profile?.avatarSrc;

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <AccountSidebar
            userName={userName}
            tierLabel={tierLabel}
            avatarSrc={avatarSrc}
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
