import Link from "next/link";
import clsx from "clsx";
import { Download, Search } from "lucide-react";
import { Card, EmptyState, PageHeader, Pagination, StatusBadge, adminInput, smallBtn, td, th } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { db } from "@/lib/db";
import { pkDateInput, resolveRange } from "@/lib/analytics";
import { formatDateTime, pkr } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Orders" };
const PER_PAGE = 25;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status && sp.status in STATUS_LABEL ? (sp.status as OrderStatus) : undefined;
  const range = sp.range ? resolveRange(sp.range, sp.from, sp.to) : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const base: Prisma.OrderWhereInput = {
    ...(range ? { createdAt: { gte: range.from, lt: range.to } } : {}),
    ...(q
      ? {
          OR: [
            { number: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\s|-/g, "") } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const where: Prisma.OrderWhereInput = { ...base, ...(status ? { status } : {}) };

  const [orders, total, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { items: { select: { quantity: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], where: base, _count: true }),
  ]);
  const countOf = (s: OrderStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const allCount = counts.reduce((s, c) => s + c._count, 0);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: q || undefined, status, range: sp.range, from: sp.from, to: sp.to, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  const exportFrom = range ? pkDateInput(range.from) : "";
  const exportTo = range ? pkDateInput(new Date(range.to.getTime() - 1)) : "";

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total.toLocaleString()} order${total === 1 ? "" : "s"}${range ? ` · ${range.label}` : ""}`}
        actions={
          <a className={smallBtn} href={`/api/admin/export/orders?format=xlsx${exportFrom ? `&from=${exportFrom}&to=${exportTo}` : ""}`}>
            <Download className="size-3.5" /> Export Excel
          </a>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form className="relative w-full lg:max-w-sm" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          {sp.range && <input type="hidden" name="range" value={sp.range} />}
          {sp.from && <input type="hidden" name="from" value={sp.from} />}
          {sp.to && <input type="hidden" name="to" value={sp.to} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Order #, name, phone or city" className={`${adminInput} pl-9`} aria-label="Search orders" />
        </form>
        <DateRangeFilter current={range?.preset ?? ""} from={range ? pkDateInput(range.from) : ""} to={range ? pkDateInput(new Date(range.to.getTime() - 1)) : ""} />
      </div>

      <div className="mb-4 -mx-4 relative overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-1 border-b border-line">
          {[{ key: undefined, label: "All", n: allCount }, ...(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => ({ key: s, label: STATUS_LABEL[s], n: countOf(s) }))].map((t) => (
            <Link
              key={t.label}
              href={href({ status: t.key, page: undefined })}
              className={clsx(
                "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
                status === t.key ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink",
              )}
            >
              {t.label} <span className="ml-1 text-xs tabular-nums text-stone">{t.n}</span>
            </Link>
          ))}
          {range && (
            <Link href={href({ range: undefined, from: undefined, to: undefined })} className="ml-2 self-center text-xs text-stone underline">
              Clear dates
            </Link>
          )}
        </div>
      </div>

      <Card bodyClassName="p-0 sm:p-0">
        {orders.length === 0 ? (
          <EmptyState title="No orders found">{q ? `Nothing matches “${q}”.` : "Orders placed on the store will appear here."}</EmptyState>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden relative overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Order</th>
                    <th className={th}>Date</th>
                    <th className={th}>Customer</th>
                    <th className={th}>Items</th>
                    <th className={th}>Payment</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#faf8f5]">
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-cognac">{o.number}</Link>
                      </td>
                      <td className={`${td} text-stone`}>{formatDateTime(o.createdAt)}</td>
                      <td className={td}>
                        <p>{o.customerName}</p>
                        <p className="text-xs text-stone">{o.phone} · {o.city}</p>
                      </td>
                      <td className={`${td} tabular-nums`}>{o.items.reduce((s, i) => s + i.quantity, 0)} pr</td>
                      <td className={`${td} text-xs`}>
                        {o.paymentMethod === "COD" ? "COD" : o.paymentMethod.replace("_", " ")} ·{" "}
                        <span className={o.paymentStatus === "PAID" ? "text-success" : "text-stone"}>{o.paymentStatus.toLowerCase()}</span>
                      </td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} text-right tabular-nums`}>{pkr(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="block px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{o.number}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-ink-soft">{o.customerName} · {o.city}</span>
                      <span className="shrink-0 tabular-nums">{pkr(o.total)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone">{formatDateTime(o.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} hrefFor={(p) => href({ page: String(p) })} />
    </>
  );
}
