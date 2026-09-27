import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AddressManager } from "@/components/store/AddressManager";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });
  return (
    <div>
      <h2 className="font-display text-2xl">Addresses</h2>
      <p className="mt-1 text-sm text-stone">Your default address is filled in automatically at checkout.</p>
      <AddressManager addresses={addresses} defaultName={user.name} defaultPhone={user.phone ?? ""} />
    </div>
  );
}
