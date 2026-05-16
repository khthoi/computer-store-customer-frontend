import { apiFetch } from "@/src/services/api";
import type {
  Address,
  CreateAddressInput,
  UpdateAddressInput,
} from "@/src/types/account-address.types";

interface RawAddress {
  id: string;
  customerId: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  createdAt: string;
}

function mapAddress(r: RawAddress): Address {
  return {
    id: r.id,
    fullName: r.recipientName,
    phone: r.phone,
    province: r.province,
    district: r.district,
    ward: r.ward,
    street: r.addressLine,
    isDefault: r.isDefault,
  };
}

function toBackendBody(input: UpdateAddressInput) {
  const body: Record<string, unknown> = {};
  if (input.fullName !== undefined) body.hoTenNguoiNhan = input.fullName;
  if (input.phone !== undefined) body.soDienThoaiNhan = input.phone;
  if (input.street !== undefined) body.diaChiChiTiet = input.street;
  if (input.ward !== undefined) body.ward = input.ward;
  if (input.district !== undefined) body.quanHuyen = input.district;
  if (input.province !== undefined) body.tinhThanhPho = input.province;
  if (input.isDefault !== undefined) body.laMacDinh = input.isDefault;
  return body;
}

export async function getMyAddresses(): Promise<Address[]> {
  const raw = await apiFetch<RawAddress[]>("/users/me/addresses");
  return raw.map(mapAddress);
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const raw = await apiFetch<RawAddress>("/users/me/addresses", {
    method: "POST",
    body: JSON.stringify(toBackendBody(input)),
  });
  return mapAddress(raw);
}

export async function updateAddress(
  id: string,
  input: UpdateAddressInput,
): Promise<Address> {
  const raw = await apiFetch<RawAddress>(`/users/me/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(toBackendBody(input)),
  });
  return mapAddress(raw);
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<void>(`/users/me/addresses/${id}`, { method: "DELETE" });
}

export async function setDefaultAddress(id: string): Promise<Address> {
  const raw = await apiFetch<RawAddress>(
    `/users/me/addresses/${id}/default`,
    { method: "PUT" },
  );
  return mapAddress(raw);
}
