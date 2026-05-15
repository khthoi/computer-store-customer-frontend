"use client";

import type { OAuthProvider } from "@/src/types/auth.types";
import { FcGoogle } from "react-icons/fc";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLoginButtonsProps {
  /** Called when the user clicks a provider button */
  onOAuth: (provider: OAuthProvider) => void;
  /** Which provider is currently loading — shows spinner, disables all */
  loadingProvider?: OAuthProvider | null;
  disabled?: boolean;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ButtonSpinner() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Provider config ──────────────────────────────────────────────────────────

interface ProviderConfig {
  id: OAuthProvider;
  label: string;
  icon: React.ReactNode;
  className: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    label: "Tiếp tục với Google",
    icon: <FcGoogle className="size-5 shrink-0" />,
    className:
      "border border-secondary-200 bg-white text-secondary-700 hover:bg-secondary-50 " +
      "focus-visible:ring-secondary-300",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * SocialLoginButtons — renders OAuth login buttons (currently Google only).
 */
export function SocialLoginButtons({
  onOAuth,
  loadingProvider = null,
  disabled = false,
}: SocialLoginButtonsProps) {
  const isAnyLoading = loadingProvider !== null;

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map(({ id, label, icon, className }) => {
        const isLoading = loadingProvider === id;
        const isDisabled = disabled || isAnyLoading;

        return (
          <button
            key={id}
            type="button"
            disabled={isDisabled}
            aria-busy={isLoading || undefined}
            onClick={() => onOAuth(id)}
            className={[
              "inline-flex h-10 w-full items-center justify-center gap-3 rounded-lg",
              "text-sm font-medium shadow-sm",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-50",
              className,
            ].join(" ")}
          >
            {isLoading ? <ButtonSpinner /> : icon}
            <span>{isLoading ? "Đang kết nối…" : label}</span>
          </button>
        );
      })}
    </div>
  );
}
