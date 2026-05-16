import { AddressPageInner } from "@/src/components/account/addresses/AddressPageInner";
import { getMyAddresses } from "@/src/services/account-address.service";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const addresses = await getMyAddresses();
  return <AddressPageInner initialAddresses={addresses} />;
}
