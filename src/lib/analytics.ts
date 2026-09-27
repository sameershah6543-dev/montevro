import "server-only";
import { db } from "./db";
import { ACTIVE_SALE_STATUSES } from "./orders";
import type { OrderStatus } from "@/generated/prisma/client";

// Pakistan Standard Time is a fixed UTC+5 (no DST), so plain offset math is exact.
const PK_OFFSET = 5 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** Wall-clock parts in Karachi for a UTC instant. */
function pk(d: Date) {
  const s = new Date(d.getTime() + PK_OFFSET);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), d: s.getUTCDate(), h: s.getUTCHours(), dow: s.getUTCDay() };
}
/** UTC instant for a Karachi wall-clock date. */
function fromPk(y: number, m: number, d = 1, h = 0) {
  return new Date(Date.UTC(y, m, d, h) - PK_OFFSET);
}
export function pkDateInput(d: Date) {
  const p = pk(d);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export type Preset = "today" | "week" | "month" | "year" | "custom";
export type Range = { preset: Preset; from: Date; to: Date; label: string; bucket: "hour" | "day" | "month" };

/** `to` is exclusive. */
export function resolveRange(preset?: string, fromStr?: string, toStr?: string, now = new Date()): Range {
  const t = pk(now);
  const today = fromPk(t.y, t.m, t.d);
  const tomorrow = new Date(today.getTime() + DAY);
  switch (preset) {
    case "today":
      return { preset: "today", from: today, to: tomorrow, label: "Today", bucket: "hour" };
    case "week": {
      const mondayOffset = (t.dow + 6) % 7;
      return { preset: "week", from: new Date(today.getTime() - mondayOffset * DAY), to: tomorrow, label: "This week", bucket: "day" };
    }
    case "year":
      return { preset: "year", from: fromPk(t.y, 0), to: fromPk(t.y + 1, 0), label: `${t.y}`, bucket: "month" };
    case "custom": {
      const parse = (s?: string) => {
        const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return m ? fromPk(+m[1], +m[2] - 1, +m[3]) : null;
      };
      const f = parse(fromStr);
      const e = parse(toStr);
      if (f && e && e >= f) {
        const to = new Date(e.getTime() + DAY);
        const span = (to.getTime() - f.getTime()) / DAY;
        return { preset: "custom", from: f, to, label: `${fromStr} → ${toStr}`, bucket: span <= 1 ? "hour" : span <= 92 ? "day" : "month" };
      }
      break;
    }
  }
  return { preset: "month", from: fromPk(t.y, t.m), to: fromPk(t.y, t.m + 1), label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(today), bucket: "day" };
}

function previousRange(r: Range) {
  if (r.preset === "month") {
    const p = pk(r.from);
    return { from: fromPk(p.y, p.m - 1), to: r.from };
  }
  if (r.preset === "year") {
    const p = pk(r.from);
    return { from: fromPk(p.y - 1, 0), to: r.from };
  }
  const span = r.to.getTime() - r.from.getTime();
  return { from: new Date(r.from.getTime() - span), to: r.from };
}

function bucketKeys(r: Range) {
  const keys: { key: string; label: string }[] = [];
  if (r.bucket === "hour") {
    for (let h = 0; h < 24; h++) keys.push({ key: String(h), label: `${String(h).padStart(2, "0")}:00` });
  } else if (r.bucket === "day") {
    for (let t = r.from.getTime(); t < r.to.getTime(); t += DAY) {
      const p = pk(new Date(t));
      keys.push({ key: `${p.y}-${p.m}-${p.d}`, label: `${p.d} ${MONTHS[p.m]}` });
    }
  } else {
    let p = pk(r.from);
    while (fromPk(p.y, p.m) < r.to) {
      keys.push({ key: `${p.y}-${p.m}`, label: `${MONTHS[p.m]} ${String(p.y).slice(2)}` });
      p = pk(fromPk(p.y, p.m + 1));
    }
  }
  return keys;
}
function bucketOf(d: Date, bucket: Range["bucket"]) {
  const p = pk(d);
  return bucket === "hour" ? String(p.h) : bucket === "day" ? `${p.y}-${p.m}-${p.d}` : `${p.y}-${p.m}`;
}
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function periodTotals(from: Date, to: Date) {
  const [orders, expenses] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: from, lt: to }, status: { in: ACTIVE_SALE_STATUSES } },
      select: { total: true, items: { select: { quantity: true, unitCost: true } } },
    }),
    db.expense.aggregate({ where: { date: { gte: from, lt: to } }, _sum: { amount: true } }),
  ]);
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const cogs = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.unitCost * i.quantity, 0), 0);
  const pairs = orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
  const exp = expenses._sum.amount ?? 0;
  return { revenue, cogs, expenses: exp, grossProfit: revenue - cogs, netProfit: revenue - cogs - exp, orders: orders.length, pairs, aov: orders.length ? revenue / orders.length : 0 };
}

function growth(cur: number, prev: number) {
  if (prev === 0) return cur === 0 ? 0 : null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export async function getDashboard(range: Range) {
  const prev = previousRange(range);
  const [orders, expenses, current, previous, allStatus] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: range.from, lt: range.to }, status: { in: ACTIVE_SALE_STATUSES } },
      select: {
        createdAt: true,
        total: true,
        items: { select: { quantity: true, unitCost: true, unitPrice: true, productId: true, productName: true, product: { select: { category: { select: { name: true } } } } } },
      },
    }),
    db.expense.findMany({ where: { date: { gte: range.from, lt: range.to } }, include: { category: true } }),
    periodTotals(range.from, range.to),
    periodTotals(prev.from, prev.to),
    db.order.groupBy({ by: ["status"], where: { createdAt: { gte: range.from, lt: range.to } }, _count: true }),
  ]);

  // Time series
  const keys = bucketKeys(range);
  const series = new Map(keys.map((k) => [k.key, { label: k.label, revenue: 0, cogs: 0, expenses: 0, grossProfit: 0, profit: 0, orders: 0, pairs: 0 }]));
  for (const o of orders) {
    const b = series.get(bucketOf(o.createdAt, range.bucket));
    if (!b) continue;
    b.revenue += o.total;
    b.orders += 1;
    for (const i of o.items) {
      b.cogs += i.unitCost * i.quantity;
      b.pairs += i.quantity;
    }
  }
  for (const e of expenses) {
    const b = series.get(bucketOf(e.date, range.bucket));
    if (b) b.expenses += e.amount;
  }
  for (const b of series.values()) {
    b.grossProfit = b.revenue - b.cogs;
    b.profit = b.grossProfit - b.expenses;
  }

  // Product & category performance
  const products = new Map<string, { name: string; pairs: number; revenue: number; profit: number }>();
  const categories = new Map<string, { name: string; pairs: number; revenue: number }>();
  for (const o of orders)
    for (const i of o.items) {
      const pk_ = i.productId ?? i.productName;
      const p = products.get(pk_) ?? { name: i.productName, pairs: 0, revenue: 0, profit: 0 };
      p.pairs += i.quantity;
      p.revenue += i.unitPrice * i.quantity;
      p.profit += (i.unitPrice - i.unitCost) * i.quantity;
      products.set(pk_, p);
      const cn = i.product?.category.name ?? "Other";
      const c = categories.get(cn) ?? { name: cn, pairs: 0, revenue: 0 };
      c.pairs += i.quantity;
      c.revenue += i.unitPrice * i.quantity;
      categories.set(cn, c);
    }

  // Expense breakdown
  const expByCat = new Map<string, { name: string; amount: number; color: string | null }>();
  for (const e of expenses) {
    const c = expByCat.get(e.categoryId) ?? { name: e.category.name, amount: 0, color: e.category.color };
    c.amount += e.amount;
    expByCat.set(e.categoryId, c);
  }

  const statusCounts = Object.fromEntries(allStatus.map((s) => [s.status, s._count])) as Partial<Record<OrderStatus, number>>;

  return {
    range,
    kpis: current,
    previous,
    growth: {
      revenue: growth(current.revenue, previous.revenue),
      orders: growth(current.orders, previous.orders),
      pairs: growth(current.pairs, previous.pairs),
      expenses: growth(current.expenses, previous.expenses),
      netProfit: growth(current.netProfit, previous.netProfit),
      aov: growth(current.aov, previous.aov),
    },
    series: [...series.values()],
    bestSellers: [...products.values()].sort((a, b) => b.pairs - a.pairs || b.revenue - a.revenue).slice(0, 8),
    categories: [...categories.values()].sort((a, b) => b.revenue - a.revenue),
    expenseBreakdown: [...expByCat.values()].sort((a, b) => b.amount - a.amount),
    statusCounts,
  };
}

/** Month-by-month profit & loss for a calendar year (Karachi time). */
export async function getMonthlyPnL(year: number) {
  const rows = [];
  for (let m = 0; m < 12; m++) {
    const t = await periodTotals(fromPk(year, m), fromPk(year, m + 1));
    rows.push({ month: MONTHS[m], monthIndex: m, ...t });
  }
  return rows;
}
