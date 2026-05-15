"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Input } from "@/src/components/ui/Input";
import { Button } from "@/src/components/ui/Button";
import { Alert } from "@/src/components/ui/Alert";
import { PasswordInput } from "../ui/PasswordInput";
import { SocialLoginButtons } from "./SocialLoginButtons";
import { AuthService } from "@/src/services/auth.service";
import { useAuth } from "@/src/store/auth.store";
import { validateRegisterForm } from "@/src/lib/auth-validation";
import { ROUTES } from "@/src/lib/routes";
import type { OAuthProvider, RegisterFormValues } from "@/src/types/auth.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPageInnerProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
  showBrand?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RegisterPageInner({
  onSwitchToLogin,
  onSuccess,
  redirectTo = ROUTES.home,
  showBrand = true,
}: RegisterPageInnerProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [values, setValues] = useState<RegisterFormValues>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function setField<K extends keyof RegisterFormValues>(key: K, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    if (serverError) setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validateRegisterForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setServerError(null);
    try {
      const { user, accessToken } = await AuthService.register(values);
      login(user, accessToken, false);
      onSuccess?.();
      if (!onSuccess) router.push(redirectTo);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Đăng ký thất bại. Vui lòng thử lại."
      );
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
        err instanceof Error ? err.message : "Đăng ký qua mạng xã hội thất bại."
      );
    } finally {
      setOauthLoading(null);
    }
  }

  const isAnyLoading = isLoading || oauthLoading !== null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={showBrand ? "w-full max-w-lg" : "w-full"}>
      {showBrand && (
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-secondary-900">Tạo tài khoản</h1>
          <p className="mt-1.5 text-sm text-secondary-500">
            Tham gia TechStore để trải nghiệm mua sắm tốt hơn
          </p>
        </div>
      )}

      {serverError && (
        <Alert variant="error" className="mb-5">
          {serverError}
        </Alert>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Họ và tên"
          type="text"
          placeholder="Nhập họ và tên"
          autoComplete="name"
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          errorMessage={errors.name}
          prefixIcon={<UserIcon />}
          disabled={isAnyLoading}
          fullWidth
        />

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

        <Input
          label="Số điện thoại (tùy chọn)"
          type="tel"
          placeholder="0912 345 678"
          autoComplete="tel"
          value={values.phone}
          onChange={(e) => setField("phone", e.target.value)}
          errorMessage={errors.phone}
          prefixIcon={<PhoneIcon />}
          disabled={isAnyLoading}
          fullWidth
        />

        <PasswordInput
          label="Mật khẩu"
          placeholder="Tối thiểu 8 ký tự, có chữ hoa và số"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
          errorMessage={errors.password}
          helperText={!errors.password ? "Ít nhất 8 ký tự, 1 chữ hoa và 1 chữ số" : undefined}
          disabled={isAnyLoading}
        />

        <PasswordInput
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => setField("confirmPassword", e.target.value)}
          errorMessage={errors.confirmPassword}
          disabled={isAnyLoading}
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          isLoading={isLoading}
          disabled={isAnyLoading}
          className="mt-2"
        >
          Tạo tài khoản
        </Button>
      </form>

      {/* Terms notice */}
      <p className="mt-3 text-center text-xs text-secondary-400">
        Bằng cách đăng ký, bạn đồng ý với{" "}
        <Link
          href={ROUTES.staticPage("terms")}
          className="text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 rounded"
        >
          Điều khoản sử dụng
        </Link>
        .
      </p>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-secondary-200" aria-hidden="true" />
        <span className="text-xs text-secondary-400">hoặc đăng ký bằng</span>
        <span className="h-px flex-1 bg-secondary-200" aria-hidden="true" />
      </div>

      <SocialLoginButtons
        onOAuth={handleOAuth}
        loadingProvider={oauthLoading}
        disabled={isLoading}
      />

      <p className="mt-6 text-center text-sm text-secondary-500">
        Đã có tài khoản?{" "}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Đăng nhập
          </button>
        ) : (
          <Link
            href={ROUTES.login}
            className="font-semibold text-primary-600 hover:text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Đăng nhập
          </Link>
        )}
      </p>
    </div>
  );
}
