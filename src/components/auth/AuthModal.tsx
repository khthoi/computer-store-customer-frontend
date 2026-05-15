"use client";

import { Modal } from "@/src/components/ui/Modal";
import { useAuth } from "@/src/store/auth.store";
import { LoginPageInner } from "./LoginPageInner";
import { RegisterPageInner } from "./RegisterPageInner";
import type { AuthModalMode } from "@/src/types/auth.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthModalProps {
  isOpen: boolean;
  mode: AuthModalMode;
  redirectTo: string;
  onClose: () => void;
  onSwitchMode: (mode: AuthModalMode) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AuthModal — global login / register modal.
 *
 * Controlled by `AuthProvider` state. Triggered anywhere via `useAuth().openModal()`.
 *
 * ```tsx
 * // Trigger from any component:
 * const { openModal } = useAuth();
 * <button onClick={() => openModal("login", "/account")}>Đăng nhập</button>
 * ```
 */
export function AuthModal({
  isOpen,
  mode,
  redirectTo,
  onClose,
  onSwitchMode,
}: AuthModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      animated
      size="xl"
      hideCloseButton={false}
    >
      {/* Tab switcher */}
      <div className="-mx-6 -mt-5 mb-5 flex border-b border-secondary-200">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onSwitchMode(tab)}
            className={[
              "flex-1 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500",
              mode === tab
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-secondary-500 hover:text-secondary-700",
            ].join(" ")}
            aria-selected={mode === tab}
            aria-label={tab === "login" ? "Đăng nhập" : "Đăng ký"}
          >
            {tab === "login" ? "Đăng nhập" : "Đăng ký"}
          </button>
        ))}
      </div>

      {/* Form */}
      {mode === "login" ? (
        <LoginPageInner
          showBrand={false}
          onSwitchToRegister={() => onSwitchMode("register")}
          onSuccess={onClose}
          redirectTo={redirectTo}
        />
      ) : (
        <RegisterPageInner
          showBrand={false}
          onSwitchToLogin={() => onSwitchMode("login")}
          onSuccess={onClose}
          redirectTo={redirectTo}
        />
      )}
    </Modal>
  );
}

// ─── Root (reads from auth context — no circular dependency) ─────────────────

/**
 * AuthModalRoot — renders the global auth modal driven by AuthContext state.
 *
 * Place this inside `<AuthProvider>` but outside its own render tree so that
 * the modal can safely `useAuth()` without circular imports.
 *
 * ```tsx
 * // In providers.tsx:
 * <AuthProvider>
 *   {children}
 *   <AuthModalRoot />
 * </AuthProvider>
 * ```
 */
export function AuthModalRoot() {
  const { state, closeModal, setModalMode } = useAuth();
  const { isOpen, mode, redirectTo } = state.modal;

  return (
    <AuthModal
      isOpen={isOpen}
      mode={mode}
      redirectTo={redirectTo}
      onClose={closeModal}
      onSwitchMode={setModalMode}
    />
  );
}
