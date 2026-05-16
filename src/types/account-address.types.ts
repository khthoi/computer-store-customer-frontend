export interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export type CreateAddressInput = Omit<Address, "id">;
export type UpdateAddressInput = Partial<CreateAddressInput>;
