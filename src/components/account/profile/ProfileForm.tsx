"use client";

import { useState } from "react";
import {
  CheckBadgeIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/solid";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { RadioGroup, Radio } from "@/src/components/ui/Radio";
import { DateInput } from "@/src/components/ui/DateInput";
import { useRouter } from "next/navigation";
import { updateMyProfile, uploadMyAvatar } from "@/src/services/account-profile.service";
import type { UserProfile, Gender } from "@/src/types/account-profile.types";

interface ProfileFormProps {
  profile: UserProfile;
  pendingAvatarFile?: File | null;
  onSaved?: () => void;
  onSavingChange?: (saving: boolean) => void;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
}

function validate(data: {
  fullName: string;
  phone: string;
  dateOfBirth: string;
}): FormErrors {
  const errors: FormErrors = {};
  if (!data.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
  if (data.phone && !/^0\d{9}$/.test(data.phone))
    errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).";
  return errors;
}

/**
 * ProfileForm — controlled form for editing the user's personal information.
 * Optimistic save: shows a 800 ms loading state then updates local state.
 */
export function ProfileForm({ profile, pendingAvatarFile, onSaved, onSavingChange }: ProfileFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone);
  const [gender, setGender] = useState<Gender>(profile.gender);
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate({ fullName, phone, dateOfBirth });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSaving(true);
    onSavingChange?.(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      if (pendingAvatarFile) {
        await uploadMyAvatar(pendingAvatarFile);
      }
      await updateMyProfile({ fullName, phone, gender, dateOfBirth });
      setSaveSuccess(true);
      onSaved?.();
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Cập nhật thất bại. Vui lòng thử lại.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
      onSavingChange?.(false);
    }
  };

  const handleBlur = () => {
    if (touched) setErrors(validate({ fullName, phone, dateOfBirth }));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Full name */}
      <Input
        label="Họ và tên"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        onBlur={handleBlur}
        errorMessage={touched ? errors.fullName : undefined}
        placeholder="Nhập họ và tên"
        fullWidth
      />

      {/* Email — read-only with verified badge */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-secondary-700">Email</span>
          {profile.emailVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
              <CheckBadgeIcon className="h-4 w-4" />
              Đã xác minh
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-600">
              <ExclamationCircleIcon className="h-4 w-4" />
              Chưa xác minh
            </span>
          )}
        </div>
        <Input
          value={profile.email}
          disabled
          helperText="Email không thể thay đổi."
          fullWidth
        />
      </div>

      {/* Phone */}
      <Input
        label="Số điện thoại"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        onBlur={handleBlur}
        errorMessage={touched ? errors.phone : undefined}
        placeholder="0912345678"
        fullWidth
      />

      {/* Gender */}
      <div>
        <RadioGroup legend="Giới tính" direction="horizontal">
          <Radio
            label="Nam"
            value="male"
            checked={gender === "male"}
            onChange={() => setGender("male")}
          />
          <Radio
            label="Nữ"
            value="female"
            checked={gender === "female"}
            onChange={() => setGender("female")}
          />
          <Radio
            label="Khác"
            value="other"
            checked={gender === "other"}
            onChange={() => setGender("other")}
          />
        </RadioGroup>
      </div>

      {/* Date of birth */}
      <DateInput
        label="Ngày sinh"
        value={dateOfBirth}
        onChange={(v) => {
          setDateOfBirth(v);
          if (touched) setErrors(validate({ fullName, phone, dateOfBirth: v }));
        }}
        errorMessage={touched ? errors.dateOfBirth : undefined}
      />

      {/* Save button + success message */}
      <div className="flex items-center gap-4 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSaving}
          disabled={isSaving}
        >
          Lưu thay đổi
        </Button>

        {saveSuccess && (
          <span className="text-sm font-medium text-success-600">
            Cập nhật thành công!
          </span>
        )}
        {saveError && (
          <span className="text-sm font-medium text-error-600">{saveError}</span>
        )}
      </div>
    </form>
  );
}
