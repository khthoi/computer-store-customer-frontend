"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/src/components/ui/Spinner";
import { Alert } from "@/src/components/ui/Alert";
import { useAuth } from "@/src/store/auth.store";
import { OAUTH_CHANNEL_NAME } from "@/src/services/auth.service";
import { ROUTES } from "@/src/lib/routes";
import type { AuthUser } from "@/src/types/auth.types";

type OAuthMessage =
  | { type: "oauth:google:success"; token: string; expiresIn: number; user: AuthUser }
  | { type: "oauth:google:error"; message?: string };

/**
 * /oauth/callback — chạy bên trong popup OAuth.
 *
 * Gửi kết quả về parent qua `BroadcastChannel` (đáng tin cậy hơn `window.opener`,
 * vì opener bị Google's COOP null hoá sau cross-origin redirect). Sau đó
 * `window.close()`.
 *
 * Fallback: nếu user mở trực tiếp URL này (không có popup parent), tự đăng nhập
 * và redirect về `/`.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const expiresInRaw = searchParams.get("expiresIn");
    const userB64 = searchParams.get("user");

    const broadcast = (msg: OAuthMessage): boolean => {
      let sent = false;
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const ch = new BroadcastChannel(OAUTH_CHANNEL_NAME);
          ch.postMessage(msg);
          ch.close();
          sent = true;
        } catch {
          // ignore
        }
      }
      try {
        if (window.opener && window.opener !== window) {
          window.opener.postMessage(msg, window.location.origin);
          sent = true;
        }
      } catch {
        // opener may be null after cross-origin nav — broadcast still covers this
      }
      return sent;
    };

    const closePopup = () => {
      try {
        window.close();
      } catch {
        // ignore
      }
    };

    // ── Trường hợp lỗi ──
    if (error || !token || !userB64) {
      const message = "Đăng nhập Google thất bại. Vui lòng thử lại.";
      const sent = broadcast({ type: "oauth:google:error", message });
      if (sent) {
        closePopup();
        setErrorMessage(message);
        return;
      }
      setErrorMessage(message);
      const t = window.setTimeout(() => router.replace(`${ROUTES.login}?error=oauth_failed`), 1500);
      return () => window.clearTimeout(t);
    }

    // ── Decode user ──
    let user: AuthUser;
    try {
      const json = atob(userB64.replace(/-/g, "+").replace(/_/g, "/"));
      user = JSON.parse(json) as AuthUser;
    } catch {
      const message = "Dữ liệu đăng nhập không hợp lệ.";
      broadcast({ type: "oauth:google:error", message });
      closePopup();
      setErrorMessage(message);
      return;
    }

    const expiresIn = Number(expiresInRaw) || 3600;

    // ── Gửi kết quả về parent qua BroadcastChannel + postMessage ──
    const sent = broadcast({ type: "oauth:google:success", token, expiresIn, user });

    if (sent) {
      // Có channel hoặc opener — parent sẽ xử lý. Đóng popup.
      closePopup();
      return;
    }

    // ── Fallback (không có cách gửi về parent): tự đăng nhập + redirect ──
    login(user, token, false);
    router.replace(ROUTES.home);
  }, [searchParams, router, login]);

  // ── UI ──
  if (errorMessage) {
    return (
      <div className="w-full max-w-md">
        <Alert variant="error">{errorMessage}</Alert>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
      <Spinner size="lg" />
      <p className="text-sm text-secondary-500">Đang hoàn tất đăng nhập…</p>
    </div>
  );
}
