import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { pkr } from "@/lib/format";
import { AccountOrderRow } from "@/components/store/AccountOrderRow";

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const [orders, orderCount, wishCount, address, spent] = await Promise.all([
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { items: true } }),
    db.order.count({ where: { userId: user.id } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } }),
    db.order.aggregate({ where: { userId: user.id, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { total: true } }),
  ]);

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Orders", String(orderCount), "/account/orders"],
          ["Wishlist", String(wishCount), "/account/wishlist"],
          ["Total spent", pkr(spent._sum.total ?? 0), "/account/orders"],
        ].map(([label, value, href]) => (
          <Link key={label} href={href} className="border border-line bg-white/60 p-5 transition-colors hover:border-ink">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl">Recent orders</h2>
          {orderCount > 3 && <Link href="/account/orders" className="link-u text-xs uppercase tracking-widest">View all</Link>}
        </div>
        {orders.length ? (
          <div className="mt-5 space-y-3">{orders.map((o) => <AccountOrderRow key={o.id} order={o} />)}</div>
        ) : (
          <div className="mt-5 border border-line bg-white/60 px-6 py-10 text-center">
            <p className="text-sm text-stone">You haven't placed an order yet.</p>
            <Link href="/shop" className="btn-primary mt-6">Shop the collection</Link>
          </div>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="border border-line bg-white/60 p-6">
          <p className="eyebrow">Account details</p>
          <p className="mt-3 text-sm">{user.name}</p>
          <p className="text-sm text-stone">{user.email}</p>
          {user.phone && <p className="text-sm text-stone">{user.phone}</p>}
          <Link href="/account/profile" className="link-u mt-4 inline-block text-xs uppercase tracking-widest">Edit</Link>
        </div>
        <div className="border border-line bg-white/60 p-6">
          <p className="eyebrow">Default address</p>
          {address ? (
            <p className="mt-3 text-sm leading-relaxed">
              {address.fullName}<br />{address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />{address.city}
            </p>
          ) : (
            <p className="mt-3 text-sm text-stone">No saved address yet.</p>
          )}
          <Link href="/account/addresses" className="link-u mt-4 inline-block text-xs uppercase tracking-widest">Manage</Link>
        </div>
      </section>
    </div>
  );
}
