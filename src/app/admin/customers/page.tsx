import Link from "next/link";
import { Search } from "lucide-react";
import { Card, EmptyState, PageHeader, Pill, adminInput, td, th } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDate, pkr } from "@/lib/format";
import { normalisePhone } from "@/lib/notify/whatsapp";
import { ACTIVE_SALE_STATUSES } from "@/lib/orders";

export const metadata = { title: "Customers" };

type Row = { key: string; name: string; phone: string; email: string | null; city: string | null; registered: boolean; orders: number; spent: number; last: Date | null; firstOrderId?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [users, orders] = await Promise.all([
    db.user.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, email: true, phone: true, createdAt: true } }),
    db.order.findMany({ select: { id: true, userId: true, customerName: true, phone: true, email: true, city: true, total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);

  // Group orders by account when present, otherwise by normalised phone number.
  const rows = new Map<string, Row>();
  for (const u of users) rows.set(`u:${u.id}`, { key: `u:${u.id}`, name: u.name, phone: u.phone ?? "", email: u.email, city: null, registered: true, orders: 0, spent: 0, last: null });
  for (const o of orders) {
    const key = o.userId && rows.has(`u:${o.userId}`) ? `u:${o.userId}` : `p:${normalisePhone(o.phone)}`;
    const r = rows.get(key) ?? { key, name: o.customerName, phone: o.phone, email: o.email, city: o.city, registered: false, orders: 0, spent: 0, last: null, firstOrderId: o.id };
    r.orders += 1;
    if (ACTIVE_SALE_STATUSES.includes(o.status)) r.spent += o.total;
    if (!r.last || o.createdAt > r.last) r.last = o.createdAt;
    r.city ??= o.city;
    r.phone ||= o.phone;
    r.email ??= o.email;
    rows.set(key, r);
  }
  const term = q.trim().toLowerCase();
  const list = [...rows.values()]
    .filter((r) => !term || [r.name, r.phone, r.email ?? "", r.city ?? ""].some((v) => v.toLowerCase().includes(term)))
    .sort((a, b) => b.spent - a.spent || (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0));
  const repeat = list.filter((r) => r.orders > 1).length;

  return (
    <>
      <PageHeader title="Customers" description={`${list.length} customers · ${repeat} repeat buyer${repeat === 1 ? "" : "s"} · ${users.length} registered accounts`} />
      <form className="relative mb-4 w-full sm:max-w-sm" action="/admin/customers">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden />
        <input name="q" defaultValue={q} placeholder="Name, phone, email or city" className={`${adminInput} pl-9`} aria-label="Search customers" />
      </form>
      <Card bodyClassName="p-0 sm:p-0">
        {list.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Customer</th>
                  <th className={th}>Contact</th>
                  <th className={th}>City</th>
                  <th className={`${th} text-right`}>Orders</th>
                  <th className={`${th} text-right`}>Total spent</th>
                  <th className={th}>Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.slice(0, 300).map((r) => (
                  <tr key={r.key}>
                    <td className={td}>
                      <span className="font-medium">{r.name}</span>{" "}
                      {r.registered ? <Pill tone="good">Account</Pill> : <Pill>Guest</Pill>}
                    </td>
                    <td className={`${td} text-xs`}>
                      {r.phone && (
                        <a className="hover:text-cognac" href={`https://wa.me/${normalisePhone(r.phone)}`} target="_blank" rel="noopener">{r.phone}</a>
                      )}
                      {r.email && <span className="block text-stone">{r.email}</span>}
                    </td>
                    <td className={`${td} text-stone`}>{r.city ?? "—"}</td>
                    <td className={`${td} text-right tabular-nums`}>
                      {r.orders > 0 ? <Link className="underline hover:text-cognac" href={`/admin/orders?q=${encodeURIComponent(r.phone || r.name)}`}>{r.orders}</Link> : 0}
                    </td>
                    <td className={`${td} text-right tabular-nums`}>{pkr(r.spent)}</td>
                    <td className={`${td} text-stone`}>{r.last ? formatDate(r.last) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
