import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Card, PageHeader, StatTile, StatusBadge, TableWrap, td, th } from "@/components/admin/ui";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { ComboChart, HBarList } from "@/components/admin/charts";
import { SERIES } from "@/components/admin/palette";
import { getDashboard, pkDateInput, resolveRange } from "@/lib/analytics";
import { lowStockVariants } from "@/lib/inventory";
import { db } from "@/lib/db";
import { compactPkr, formatDateTime, pkr } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/client";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const range = resolveRange(sp.range, sp.from, sp.to);
  const [d, low, recent] = await Promise.all([
    getDashboard(range),
    lowStockVariants(8),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, number: true, customerName: true, city: true, total: true, status: true, createdAt: true } }),
  ]);
  const k = d.kpis;
  const lastDay = new Date(range.to.getTime() - 1);
  const margin = k.revenue ? (k.netProfit / k.revenue) * 100 : 0;
  const statuses = Object.keys(STATUS_LABEL) as OrderStatus[];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={<>Showing <b className="font-medium text-ink">{range.label}</b> · compared with the previous period</>}
        actions={<DateRangeFilter current={range.preset} from={pkDateInput(range.from)} to={pkDateInput(lastDay)} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Revenue" value={compactPkr(k.revenue)} growth={d.growth.revenue} sub={pkr(k.revenue)} />
        <StatTile label="Orders" value={k.orders.toLocaleString()} growth={d.growth.orders} />
        <StatTile label="Pairs sold" value={k.pairs.toLocaleString()} growth={d.growth.pairs} />
        <StatTile label="Avg order value" value={compactPkr(k.aov)} growth={d.growth.aov} />
        <StatTile label="Expenses" value={compactPkr(k.expenses)} growth={d.growth.expenses} invert />
        <StatTile
          label="Net profit"
          value={compactPkr(k.netProfit)}
          growth={d.growth.netProfit}
          sub={<>Gross {compactPkr(k.grossProfit)} · COGS {compactPkr(k.cogs)} · {margin.toFixed(0)}% margin</>}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title={d.range.bucket === "month" ? "Revenue vs net profit" : "Revenue vs gross profit"} className="xl:col-span-2">
          <ComboChart
            data={d.series}
            series={[
              { key: "revenue", name: "Revenue", color: SERIES.s1, kind: "bar", money: true },
              // Expenses are booked on single days (rent, salaries), so daily net profit is misleading — use gross profit below monthly granularity
              d.range.bucket === "month"
                ? { key: "profit", name: "Net profit (after COGS & expenses)", color: SERIES.s2, kind: "line", money: true }
                : { key: "grossProfit", name: "Gross profit (revenue − cost of shoes)", color: SERIES.s2, kind: "line", money: true },
            ]}
          />
        </Card>
        <Card title="Pairs sold">
          <ComboChart data={d.series} money={false} series={[{ key: "pairs", name: "Pairs sold", color: SERIES.s1, kind: "bar" }]} height={250} />
          <p className="mt-3 text-xs text-stone">
            {k.pairs.toLocaleString()} pairs across {k.orders.toLocaleString()} orders in {range.label.toLowerCase()}.
          </p>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Expense breakdown" action={<Link href="/admin/expenses" className="text-xs text-stone hover:text-ink">Manage</Link>}>
          <HBarList color={SERIES.s1} rows={d.expenseBreakdown.map((e) => ({ label: e.name, value: e.amount, sub: k.expenses ? `${Math.round((e.amount / k.expenses) * 100)}%` : undefined }))} empty="No expenses recorded" />
        </Card>
        <Card title="Category performance">
          <HBarList color={SERIES.s1} rows={d.categories.map((c) => ({ label: c.name, value: c.revenue, sub: `${c.pairs} pairs` }))} empty="No sales yet" />
        </Card>
        <Card title="Orders by status">
          <HBarList
            money={false}
            color="#57534e"
            rows={statuses.map((s) => ({ label: STATUS_LABEL[s], value: d.statusCounts[s] ?? 0 })).filter((r) => r.value > 0)}
            empty="No orders in this period"
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Best sellers" className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
          {d.bestSellers.length === 0 ? (
            <p className="p-5 text-sm text-stone">No sales in this period.</p>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Product</th>
                    <th className={`${th} text-right`}>Pairs</th>
                    <th className={`${th} text-right`}>Revenue</th>
                    <th className={`${th} text-right`}>Gross profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {d.bestSellers.map((p, i) => (
                    <tr key={p.name}>
                      <td className={td}>
                        <span className="mr-2 text-stone tabular-nums">{i + 1}.</span>
                        {p.name}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{p.pairs}</td>
                      <td className={`${td} text-right tabular-nums`}>{pkr(p.revenue)}</td>
                      <td className={`${td} text-right tabular-nums`}>{pkr(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="size-3.5 text-warning" aria-hidden /> Low stock
            </span>
          }
          action={<Link href="/admin/inventory?low=1" className="text-xs text-stone hover:text-ink">Inventory</Link>}
        >
          {low.length === 0 ? (
            <p className="text-sm text-stone">All sizes are above their alert level.</p>
          ) : (
            <ul className="divide-y divide-line">
              {low.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate">
                    {v.product.name} <span className="text-stone">· EU {v.size}</span>
                  </span>
                  <span className={v.stock === 0 ? "shrink-0 font-medium text-danger" : "shrink-0 font-medium text-warning"}>
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4" title="Recent orders" action={<Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs text-stone hover:text-ink">All orders <ArrowRight className="size-3" /></Link>} bodyClassName="p-0 sm:p-0">
        <TableWrap>
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Order</th>
                <th className={th}>Customer</th>
                <th className={th}>Date</th>
                <th className={th}>Status</th>
                <th className={`${th} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((o) => (
                <tr key={o.id} className="hover:bg-[#faf8f5]">
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:text-cognac">{o.number}</Link>
                  </td>
                  <td className={td}>
                    {o.customerName} <span className="text-stone">· {o.city}</span>
                  </td>
                  <td className={`${td} text-stone`}>{formatDateTime(o.createdAt)}</td>
                  <td className={td}><StatusBadge status={o.status} /></td>
                  <td className={`${td} text-right tabular-nums`}>{pkr(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <details className="mt-4 border border-line bg-white px-5 py-3 text-sm">
        <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-[0.18em] text-ink-soft">Data table · {range.label}</summary>
        <div className="mt-3 relative overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                {["Period", "Orders", "Pairs", "Revenue", "COGS", "Expenses", "Net profit"].map((h) => (
                  <th key={h} className={`${th} !px-2 ${h === "Period" ? "" : "text-right"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.series.map((r) => (
                <tr key={r.label}>
                  <td className="px-2 py-1.5">{r.label}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.orders}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{r.pairs}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pkr(r.revenue)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pkr(r.cogs)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pkr(r.expenses)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{pkr(r.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
