import { ProfilePageInner } from "@/src/components/account/profile/ProfilePageInner";
import { getMyProfile } from "@/src/services/account-profile.service";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  return <ProfilePageInner profile={profile} />;
}
