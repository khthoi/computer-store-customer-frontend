"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Checkbox } from "@/src/components/ui/Checkbox";
import { Alert } from "@/src/components/ui/Alert";
import { PasswordInput } from "../ui/PasswordInput";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { AuthService } from "@/src/services/auth.service";
import { useAuth } from "@/src/store/auth.store";
import { validateLoginForm } from "@/src/lib/auth-validation";
import { ROUTES } from "@/src/lib/routes";
import type { LoginFormValues, OAuthProvider } from "@/src/types/auth.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginPageInnerProps {
  /**
   * Modal context: switch to the Register tab without navigating.
   * When undefined, the "Đăng ký ngay" link uses `<Link>` for page navigation.
   */
  onSwitchToRegister?: () => void;
  /**
   * Called after a successful login (modal only — for closing the modal / redirect).
   * In page mode, the component handles its own redirect.
   */
  onSuccess?: () => void;
  /** Redirect path after login (page mode). Defaults to "/". */
  redirectTo?: string;
  /** Show brand header (logo + title). Set false when inside a modal. */
  showBrand?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginPageInner({
  onSwitchToRegister,
  onSuccess,
  redirectTo = ROUTES.home,
  showBrand = true,
}: LoginPageInnerProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function setField<K extends keyof LoginFormValues>(key: K, val: LoginFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key as "email" | "password"]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (serverError) setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validateLoginForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setServerError(null);
    try {
      const { user, accessToken } = await AuthService.login(values);
      login(user, accessToken, values.rememberMe);
      onSuccess?.();
      if (!onSuccess) router.push(redirectTo);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    setServerError(null);
    try {
      const { user, accessToken } = await AuthService.oauthLogin(provider);
      login(user, accessToken, false);
      onSuccess?.();
      if (!onSuccess) router.push(redirectTo);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Đăng nhập qua mạng xã hội thất bại."
      );
    } finally {
      setOauthLoading(null);
    }
  }

  const isAnyLoading = isLoading || oauthLoading !== null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={showBrand ? "w-full max-w-lg" : "w-full"}>
      {/* Brand header (page mode) */}
      {showBrand && (
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Đăng nhập</h1>
          <p className="mt-1.5 text-sm text-secondary-500">
            Chào mừng bạn quay trở lại TechStore
          </p>
        </div>
      )}

      {/* Server-level error */}
      {serverError && (
        <Alert variant="error" className="mb-5">
          {serverError}
        </Alert>
      )}

      {/* Login form */}
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          errorMessage={errors.email}
          prefixIcon={<EnvelopeIcon />}
          disabled={isAnyLoading}
          fullWidth
        />

        <div>
          <PasswordInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => setField("password", e.target.value)}
            errorMessage={errors.password}
            disabled={isAnyLoading}
          />
        </div>

        {/* Remember Me + Forgot Password row */}
        <div className="flex items-center justify-between gap-4">
          <Checkbox
            label="Ghi nhớ đăng nhập"
            checked={values.rememberMe}
            onChange={(e) => setField("rememberMe", e.target.checked)}
            disabled={isAnyLoading}
          />
          <Link
            href={ROUTES.forgotPassword}
            className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1 rounded"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isAnyLoading}
          className="mt-2"
        >
          Đăng nhập
        </Button>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-secondary-200" aria-hidden="true" />
        <span className="text-xs text-secondary-400">hoặc đăng nhập bằng</span>
        <span className="h-px flex-1 bg-secondary-200" aria-hidden="true" />
      </div>

      {/* OAuth */}
      <SocialLoginButtons
        onOAuth={handleOAuth}
        loadingProvider={oauthLoading}
        disabled={isLoading}
      />

      {/* Switch to Register */}
      <p className="mt-6 text-center text-sm text-secondary-500">
        Chưa có tài khoản?{" "}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Đăng ký ngay
          </button>
        ) : (
          <Link
            href={ROUTES.register}
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Đăng ký ngay
          </Link>
        )}
      </p>
    </div>
  );
}
