"use client";

import { useState } from "react";
import { AvatarUpload } from "@/src/components/account/profile/AvatarUpload";
import { ProfileForm } from "@/src/components/account/profile/ProfileForm";
import type { UserProfile } from "@/src/types/account-profile.types";

export interface ProfilePageInnerProps {
  profile: UserProfile;
}

/**
 * ProfilePageInner — client root for /account/profile.
 *
 * Layout:
 *   Left:  avatar upload
 *   Right: personal info form
 */
export function ProfilePageInner({ profile }: ProfilePageInnerProps) {
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-6">
      <h1 className="mb-6 text-lg font-bold text-secondary-900">
        Hồ sơ cá nhân
      </h1>

      <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
        {/* Avatar */}
        <div className="shrink-0 md:w-70">
          <AvatarUpload
            name={profile.fullName}
            currentSrc={profile.avatarSrc}
            onFileSelected={setPendingAvatarFile}
            disabled={isSaving}
          />
        </div>

        {/* Divider (desktop) */}
        <div className="hidden md:block w-px bg-secondary-100 self-stretch" />

        {/* Form */}
        <div className="flex-1 min-w-0">
          <ProfileForm
            profile={profile}
            pendingAvatarFile={pendingAvatarFile}
            onSavingChange={setIsSaving}
          />
        </div>
      </div>
    </div>
  );
}
