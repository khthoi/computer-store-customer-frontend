import { apiFetch } from "@/src/services/api";
import type {
  Gender,
  UpdateProfileInput,
  UserProfile,
} from "@/src/types/account-profile.types";

interface RawProfile {
  id: string;
  code: string;
  email: string;
  fullName: string;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  status: string;
  registeredAt: string;
  emailVerified: boolean;
  points: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

function mapProfile(r: RawProfile): UserProfile {
  const normalizedGender: Gender =
    r.gender === "male" || r.gender === "female" || r.gender === "other"
      ? r.gender
      : "other";

  return {
    id: r.id,
    fullName: r.fullName ?? "",
    email: r.email,
    emailVerified: r.emailVerified,
    phone: r.phone ?? "",
    gender: normalizedGender,
    dateOfBirth: r.dateOfBirth ?? "",
    avatarSrc: r.avatarUrl ?? undefined,
  };
}

function toBackendGender(g?: Gender): "Nam" | "Nu" | "Khac" | undefined {
  if (!g) return undefined;
  if (g === "male") return "Nam";
  if (g === "female") return "Nu";
  return "Khac";
}

export async function getMyProfile(): Promise<UserProfile> {
  const raw = await apiFetch<RawProfile>("/users/me");
  return mapProfile(raw);
}

export async function updateMyProfile(
  input: UpdateProfileInput,
): Promise<UserProfile> {
  const body: Record<string, unknown> = {};
  if (input.fullName !== undefined) body.hoTen = input.fullName;
  if (input.phone !== undefined) body.soDienThoai = input.phone;
  if (input.dateOfBirth) body.ngaySinh = input.dateOfBirth;
  if (input.gender !== undefined) body.gioiTinh = toBackendGender(input.gender);

  const raw = await apiFetch<RawProfile>("/users/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return mapProfile(raw);
}

export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append("avatar", file);
  const raw = await apiFetch<RawProfile>("/users/me/avatar", {
    method: "PATCH",
    body: form,
  });
  return mapProfile(raw);
}
