import Link from "next/link";
import clsx from "clsx";
import { Download } from "lucide-react";
import { Card, PageHeader, StatTile, adminInput, smallBtn, td, th } from "@/components/admin/ui";
import { ComboChart } from "@/components/admin/charts";
import { SERIES } from "@/components/admin/palette";
import { getMonthlyPnL, pkDateInput } from "@/lib/analytics";
import { db } from "@/lib/db";
import { compactPkr, pct, pkr } from "@/lib/format";

export const metadata = { title: "Finance & Reports" };

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const nowYear = Number(pkDateInput(new Date()).slice(0, 4));
  const year = Number(sp.year) >= 2020 && Number(sp.year) <= nowYear + 1 ? Number(sp.year) : nowYear;
  const [rows, first] = await Promise.all([getMonthlyPnL(year), db.order.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } })]);
  const firstYear = first ? Math.min(nowYear, Number(pkDateInput(first.createdAt).slice(0, 4))) : nowYear;
  const years = Array.from({ length: nowYear - firstYear + 1 }, (_, i) => nowYear - i);

  const tot = rows.reduce(
    (a, r) => ({ revenue: a.revenue + r.revenue, cogs: a.cogs + r.cogs, grossProfit: a.grossProfit + r.grossProfit, expenses: a.expenses + r.expenses, netProfit: a.netProfit + r.netProfit, orders: a.orders + r.orders, pairs: a.pairs + r.pairs }),
    { revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0, orders: 0, pairs: 0 },
  );
  const withActivity = rows.filter((r) => r.revenue || r.expenses);
  const best = [...rows].sort((a, b) => b.netProfit - a.netProfit)[0];

  const today = new Date();
  const monthStart = `${pkDateInput(today).slice(0, 7)}-01`;
  const todayStr = pkDateInput(today);

  return (
    <>
      <PageHeader
        title="Finance & Reports"
        description="Profit & loss by month, based on orders (excluding cancelled/returned) and recorded expenses."
        actions={
          <div className="flex gap-1" role="group" aria-label="Year">
            {years.map((y) => (
              <Link key={y} href={`/admin/finance?year=${y}`} className={clsx("px-3 py-1.5 text-sm", y === year ? "bg-ink text-ivory" : "border border-line bg-white text-ink-soft hover:border-ink")}>
                {y}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatTile label={`Revenue ${year}`} value={compactPkr(tot.revenue)} sub={pkr(tot.revenue)} />
        <StatTile label="Cost of goods" value={compactPkr(tot.cogs)} sub={`Gross profit ${compactPkr(tot.grossProfit)}`} />
        <StatTile label="Expenses" value={compactPkr(tot.expenses)} />
        <StatTile label="Net profit" value={compactPkr(tot.netProfit)} sub={tot.revenue ? `${((tot.netProfit / tot.revenue) * 100).toFixed(1)}% net margin` : undefined} />
        <StatTile label="Pairs sold" value={tot.pairs.toLocaleString()} sub={`${tot.orders.toLocaleString()} orders${best && best.netProfit > 0 ? ` · best month ${best.month}` : ""}`} />
      </div>

      <Card className="mt-4" title={`Monthly revenue, expenses & net profit · ${year}`}>
        <ComboChart
          data={rows.map((r) => ({ label: r.month, revenue: r.revenue, expenses: r.expenses, netProfit: r.netProfit }))}
          series={[
            { key: "revenue", name: "Revenue", color: SERIES.s1, kind: "bar", money: true },
            { key: "expenses", name: "Expenses", color: SERIES.s2, kind: "bar", money: true },
            { key: "netProfit", name: "Net profit", color: SERIES.s3, kind: "line", money: true },
          ]}
          height={300}
        />
      </Card>

      <Card className="mt-4" title={`Profit & loss statement · ${year}`} bodyClassName="p-0 sm:p-0" action={
        <span className="flex gap-2">
          <a className={smallBtn} href={`/api/admin/export/pnl?year=${year}&format=xlsx`}><Download className="size-3.5" /> Excel</a>
          <a className={smallBtn} href={`/api/admin/export/pnl?year=${year}&format=csv`}>CSV</a>
        </span>
      }>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-line">
              <tr>
                {["Month", "Orders", "Pairs", "Revenue", "COGS", "Gross profit", "Expenses", "Net profit", "Margin", "MoM revenue"].map((h, i) => (
                  <th key={h} className={clsx(th, i > 0 && "text-right")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r, i) => {
                const prev = i > 0 ? rows[i - 1].revenue : null;
                const mom = prev === null ? null : prev === 0 ? (r.revenue ? null : 0) : ((r.revenue - prev) / prev) * 100;
                const quiet = !r.revenue && !r.expenses;
                return (
                  <tr key={r.month} className={quiet ? "text-stone" : ""}>
                    <td className={td}>{r.month} {year}</td>
                    <td className={`${td} text-right tabular-nums`}>{r.orders}</td>
                    <td className={`${td} text-right tabular-nums`}>{r.pairs}</td>
                    <td className={`${td} text-right tabular-nums`}>{pkr(r.revenue)}</td>
                    <td className={`${td} text-right tabular-nums`}>{pkr(r.cogs)}</td>
                    <td className={`${td} text-right tabular-nums`}>{pkr(r.grossProfit)}</td>
                    <td className={`${td} text-right tabular-nums`}>{pkr(r.expenses)}</td>
                    <td className={clsx(td, "text-right font-medium tabular-nums", r.netProfit < 0 && "text-danger")}>{pkr(r.netProfit)}</td>
                    <td className={`${td} text-right tabular-nums`}>{r.revenue ? `${((r.netProfit / r.revenue) * 100).toFixed(1)}%` : "—"}</td>
                    <td className={clsx(td, "text-right tabular-nums", mom !== null && mom > 0 && "text-success", mom !== null && mom < 0 && "text-danger")}>
                      {i === 0 || quiet ? "—" : pct(mom)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-ink font-medium">
              <tr>
                <td className={td}>Total {year}</td>
                <td className={`${td} text-right tabular-nums`}>{tot.orders}</td>
                <td className={`${td} text-right tabular-nums`}>{tot.pairs}</td>
                <td className={`${td} text-right tabular-nums`}>{pkr(tot.revenue)}</td>
                <td className={`${td} text-right tabular-nums`}>{pkr(tot.cogs)}</td>
                <td className={`${td} text-right tabular-nums`}>{pkr(tot.grossProfit)}</td>
                <td className={`${td} text-right tabular-nums`}>{pkr(tot.expenses)}</td>
                <td className={clsx(td, "text-right tabular-nums", tot.netProfit < 0 && "text-danger")}>{pkr(tot.netProfit)}</td>
                <td className={`${td} text-right tabular-nums`}>{tot.revenue ? `${((tot.netProfit / tot.revenue) * 100).toFixed(1)}%` : "—"}</td>
                <td className={td} />
              </tr>
            </tfoot>
          </table>
        </div>
        {withActivity.length === 0 && <p className="border-t border-line px-5 py-3 text-sm text-stone">No sales or expenses recorded in {year} yet.</p>}
      </Card>

      <Card className="mt-4" title="Download reports">
        <form action="/api/admin/export/orders" method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
          <p className="text-sm font-medium sm:pb-2.5">Orders report</p>
          <label className="block"><span className="label">From</span><input type="date" name="from" defaultValue={monthStart} className={adminInput} required /></label>
          <label className="block"><span className="label">To</span><input type="date" name="to" defaultValue={todayStr} className={adminInput} required /></label>
          <button name="format" value="xlsx" className={smallBtn}>Excel</button>
          <button name="format" value="csv" className={smallBtn}>CSV</button>
        </form>
        <form action="/api/admin/export/expenses" method="get" className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_1fr_auto_auto] sm:items-end">
          <p className="text-sm font-medium sm:pb-2.5">Expenses report</p>
          <label className="block"><span className="label">From</span><input type="date" name="from" defaultValue={monthStart} className={adminInput} required /></label>
          <label className="block"><span className="label">To</span><input type="date" name="to" defaultValue={todayStr} className={adminInput} required /></label>
          <button name="format" value="xlsx" className={smallBtn}>Excel</button>
          <button name="format" value="csv" className={smallBtn}>CSV</button>
        </form>
        <p className="mt-3 text-xs text-stone">Excel files open in Microsoft Excel and Google Sheets. CSV works everywhere.</p>
      </Card>
    </>
  );
}
