// ─── Auth domain types ─────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  role: "customer" | "admin";
}

export type OAuthProvider = "google";

export type AuthModalMode = "login" | "register";

// ─── Form value types ──────────────────────────────────────────────────────────

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormValues {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

// ─── API response types ────────────────────────────────────────────────────────

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  /** Seconds until the access token expires (default 3600) */
  expiresIn: number;
}
