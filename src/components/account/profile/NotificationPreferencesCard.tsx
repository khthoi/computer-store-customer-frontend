"use client";

import { useEffect, useState } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Toggle } from "@/src/components/ui/Toggle";
import { updateNotificationPreferences } from "@/src/services/account-profile.service";

export interface NotificationPreferencesCardProps {
  initialEnabled: boolean;
}

/**
 * NotificationPreferencesCard — toggle for email notification opt-in.
 *
 * Optimistic update: flips the toggle immediately, then calls the API.
 * Reverts on error and surfaces an inline error message.
 */
export function NotificationPreferencesCard({
  initialEnabled,
}: NotificationPreferencesCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!showSaved) return;
    const timer = window.setTimeout(() => setShowSaved(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showSaved]);

  async function handleChange(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setError(null);
    setSaving(true);
    try {
      const profile = await updateNotificationPreferences(next);
      setEnabled(profile.emailNotificationsEnabled);
      setShowSaved(true);
    } catch (e) {
      setEnabled(previous);
      const message =
        e instanceof Error && e.message ? e.message : "Cập nhật thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-secondary-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-secondary-900">Tùy chọn thông báo</h2>
        <p className="mt-1 text-xs text-secondary-500">
          Quản lý cách bạn nhận cập nhật từ cửa hàng.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-secondary-100 bg-secondary-50/50 px-4 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-secondary-900">
            Nhận thông báo qua email
          </p>
          <p className="mt-1 text-xs text-secondary-500">
            Bao gồm cập nhật đơn hàng, khuyến mãi và điểm thưởng. Thông báo trong ứng dụng vẫn được giữ nguyên khi tắt.
          </p>
        </div>
        <div className="shrink-0">
          <Toggle
            checked={enabled}
            disabled={saving}
            onChange={(e) => handleChange(e.target.checked)}
            aria-label="Nhận thông báo qua email"
          />
        </div>
      </div>

      {/* Status row */}
      <div className="mt-3 flex min-h-[1.25rem] items-center gap-2 text-xs">
        {saving && <span className="text-secondary-500">Đang lưu…</span>}
        {!saving && showSaved && (
          <span className="inline-flex items-center gap-1 font-medium text-success-600">
            <CheckCircleIcon className="h-4 w-4" />
            Đã lưu tùy chọn của bạn
          </span>
        )}
        {!saving && error && (
          <span className="inline-flex items-center gap-1 font-medium text-error-600">
            <ExclamationCircleIcon className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
