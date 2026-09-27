import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AccountOrderRow } from "@/components/store/AccountOrderRow";

export default async function AccountOrders() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });

  return (
    <div>
      <h2 className="font-display text-2xl">Order history</h2>
      {orders.length ? (
        <div className="mt-5 space-y-3">{orders.map((o) => <AccountOrderRow key={o.id} order={o} />)}</div>
      ) : (
        <div className="mt-5 border border-line bg-white/60 px-6 py-12 text-center">
          <p className="text-sm text-stone">No orders yet. Orders you place while signed in — or with this account's email — appear here.</p>
          <Link href="/shop" className="btn-primary mt-6">Shop the collection</Link>
        </div>
      )}
    </div>
  );
}
