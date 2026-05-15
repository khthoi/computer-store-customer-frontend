/**
 * auth.service.ts — Customer auth service.
 *
 * Wires real backend endpoints (NestJS @ localhost:4000):
 *   POST /api/auth/login
 *   POST /api/auth/register
 *   POST /api/auth/forgot-password
 *   GET  /api/auth/reset-password?token=
 *   POST /api/auth/reset-password
 *   POST /api/auth/logout
 *
 * Google OAuth is initiated by SocialLoginButtons (popup) and resolved at
 * `/oauth/callback` page — it does NOT go through this service.
 */

import { apiFetch, API_ORIGIN, API_PREFIX } from "@/src/services/api";
import type {
  AuthResponse,
  AuthUser,
  LoginFormValues,
  OAuthProvider,
  RegisterFormValues,
} from "@/src/types/auth.types";

// ─── OAuth popup ─────────────────────────────────────────────────────────────

const POPUP_W = 500;
const POPUP_H = 600;
const POPUP_NAME = "google-oauth";
export const OAUTH_CHANNEL_NAME = "oauth-google";

type OAuthMessage =
  | { type: "oauth:google:success"; token: string; expiresIn: number; user: AuthUser }
  | { type: "oauth:google:error"; message?: string };

function openCenteredPopup(url: string): Window | null {
  const left = Math.max(0, Math.floor((window.screen.width - POPUP_W) / 2));
  const top = Math.max(0, Math.floor((window.screen.height - POPUP_H) / 2));
  return window.open(
    url,
    POPUP_NAME,
    `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`,
  );
}

/**
 * Đợi message từ popup OAuth.
 *
 * Dùng `BroadcastChannel` làm kênh chính vì `window.opener.postMessage` không
 * còn tin cậy: trang `accounts.google.com` set `Cross-Origin-Opener-Policy: same-origin`
 * → khi popup redirect qua Google rồi quay về origin của ta, `window.opener` đã bị
 * browser null hoá. BroadcastChannel hoạt động giữa các window cùng origin và
 * sống sót qua cross-origin navigation.
 *
 * Cũng lắng nghe `postMessage` truyền thống làm dự phòng cho trình duyệt
 * không hỗ trợ BroadcastChannel.
 */
/** Số phút tối đa user có thể giữ flow OAuth trước khi parent tự huỷ. */
const OAUTH_TIMEOUT_MS = 10 * 60 * 1000;

function waitForOAuthMessage(popup: Window): Promise<AuthResponse> {
  // Note: KHÔNG poll `popup.closed` — sau khi popup navigate sang accounts.google.com
  // (Cross-Origin-Opener-Policy: same-origin), browser cắt đứt mối quan hệ
  // opener ↔ popup nên `popup.closed` báo `true` dù popup vẫn đang mở.
  // Chỉ trust BroadcastChannel/postMessage để biết kết quả.
  void popup;
  return new Promise((resolve, reject) => {
    let settled = false;
    let channel: BroadcastChannel | null = null;
    let timeoutId: number | null = null;

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      if (channel) {
        channel.close();
        channel = null;
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const handle = (data: OAuthMessage | undefined) => {
      if (settled || !data || typeof data !== "object") return;
      if (data.type === "oauth:google:success") {
        settled = true;
        cleanup();
        resolve({ user: data.user, accessToken: data.token, expiresIn: data.expiresIn });
      } else if (data.type === "oauth:google:error") {
        settled = true;
        cleanup();
        reject(new Error(data.message ?? "Đăng nhập Google thất bại. Vui lòng thử lại."));
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      handle(event.data as OAuthMessage | undefined);
    };

    window.addEventListener("message", handleMessage);

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(OAUTH_CHANNEL_NAME);
      channel.onmessage = (event) => handle(event.data as OAuthMessage | undefined);
    }

    timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("Hết thời gian đăng nhập Google. Vui lòng thử lại."));
      }
    }, OAUTH_TIMEOUT_MS);
  });
}

// Backend register DTO uses Vietnamese ERD names.
interface BackendRegisterBody {
  email: string;
  hoTen: string;
  matKhau: string;
  soDienThoai?: string;
}

interface BackendValidateTokenResponse {
  valid: boolean;
}

export const AuthService = {
  /** Đăng nhập bằng email + mật khẩu. */
  async login(values: LoginFormValues): Promise<AuthResponse> {
    return apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        rememberMe: values.rememberMe,
      }),
    });
  },

  /** Đăng ký tài khoản khách hàng. */
  async register(values: RegisterFormValues): Promise<AuthResponse> {
    const body: BackendRegisterBody = {
      email: values.email.trim().toLowerCase(),
      hoTen: values.name.trim(),
      matKhau: values.password,
    };
    const phone = values.phone.trim();
    if (phone) body.soDienThoai = phone;

    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  /** Gửi email đặt lại mật khẩu — backend luôn trả 200 dù email không tồn tại. */
  async forgotPassword(email: string): Promise<void> {
    await apiFetch<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  /** Kiểm tra reset token có hợp lệ không. */
  async validateResetToken(token: string): Promise<boolean> {
    const qs = new URLSearchParams({ token }).toString();
    const result = await apiFetch<BackendValidateTokenResponse>(
      `/auth/reset-password?${qs}`,
    );
    return Boolean(result?.valid);
  },

  /** Đặt lại mật khẩu bằng token. */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiFetch<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword: password }),
    });
  },

  /** Đăng xuất — thu hồi token ở backend (xoá refresh cookie + blacklist access). */
  async logout(): Promise<void> {
    try {
      await apiFetch<void>("/auth/logout", { method: "POST" });
    } catch {
      // Ignore — local cleanup happens trong auth store dù backend lỗi.
    }
  },

  /**
   * Mở popup OAuth provider, đợi `postMessage` từ trang `/oauth/callback`.
   *
   * Trong scope hiện tại chỉ hỗ trợ `"google"`. Truyền provider khác sẽ throw.
   */
  async oauthLogin(provider: OAuthProvider): Promise<AuthResponse> {
    if (provider !== "google") {
      throw new Error("Phương thức đăng nhập này hiện chưa được hỗ trợ.");
    }
    const url = `${API_ORIGIN}${API_PREFIX}/auth/google/start`;
    const popup = openCenteredPopup(url);
    if (!popup) {
      throw new Error("Trình duyệt đã chặn popup. Vui lòng cho phép popup cho trang này và thử lại.");
    }
    try {
      popup.focus();
    } catch {
      // ignore
    }
    return waitForOAuthMessage(popup);
  },
};
