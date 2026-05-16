// Customer profile types — ground truth shape consumed by /account/profile UI.

export type Gender = "male" | "female" | "other";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  gender: Gender;
  /** "YYYY-MM-DD" — empty string when not set */
  dateOfBirth: string;
  avatarSrc?: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  gender?: Gender;
  dateOfBirth?: string;
}
