import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { CheckoutForm, type CheckoutPrefill } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await getSession();
  let prefill: CheckoutPrefill = {};
  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { addresses: { orderBy: [{ isDefault: "desc" }], take: 1 } },
    });
    if (user) {
      const a = user.addresses[0];
      prefill = {
        customerName: a?.fullName ?? user.name,
        email: user.email,
        phone: a?.phone ?? user.phone ?? "",
        addressLine1: a?.line1 ?? "",
        addressLine2: a?.line2 ?? "",
        city: a?.city ?? "",
        province: a?.province ?? "",
        postalCode: a?.postalCode ?? "",
      };
    }
  }

  return (
    <div className="container-x py-10 lg:py-16">
      <p className="eyebrow">Secure checkout</p>
      <h1 className="h-display mt-2 text-4xl sm:text-5xl">Checkout</h1>
      <CheckoutForm prefill={prefill} signedIn={!!session} />
    </div>
  );
}
