import ExcelJS from "exceljs";
import { getSession, isAdminRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMonthlyPnL, pkDateInput, resolveRange } from "@/lib/analytics";
import { formatDateTime } from "@/lib/format";

type Col = { header: string; key: string; width?: number; money?: boolean };
type Sheet = { name: string; columns: Col[]; rows: Record<string, string | number | null>[] };

function csvCell(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Neutralise spreadsheet formula injection and quote when needed
  const safe = /^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function toCsv(sheet: Sheet) {
  const lines = [sheet.columns.map((c) => csvCell(c.header)).join(",")];
  for (const r of sheet.rows) lines.push(sheet.columns.map((c) => csvCell(r[c.key])).join(","));
  return "﻿" + lines.join("\r\n");
}

async function toXlsx(sheet: Sheet) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Montevro";
  const ws = wb.addWorksheet(sheet.name);
  ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16, style: c.money ? { numFmt: '"Rs." #,##0' } : undefined }));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFE8DC" } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.addRows(sheet.rows);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

async function ordersSheet(from: Date, to: Date): Promise<Sheet> {
  const orders = await db.order.findMany({ where: { createdAt: { gte: from, lt: to } }, orderBy: { createdAt: "asc" }, include: { items: true } });
  return {
    name: "Orders",
    columns: [
      { header: "Order #", key: "number", width: 12 },
      { header: "Date", key: "date", width: 20 },
      { header: "Status", key: "status", width: 12 },
      { header: "Customer", key: "customer", width: 22 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Email", key: "email", width: 26 },
      { header: "City", key: "city", width: 14 },
      { header: "Items", key: "items", width: 48 },
      { header: "Pairs", key: "pairs", width: 8 },
      { header: "Subtotal", key: "subtotal", money: true },
      { header: "Discount", key: "discount", money: true },
      { header: "Coupon", key: "coupon", width: 12 },
      { header: "Shipping", key: "shipping", money: true },
      { header: "Total", key: "total", money: true },
      { header: "Cost of goods", key: "cogs", money: true },
      { header: "Gross profit", key: "profit", money: true },
      { header: "Payment method", key: "payment", width: 14 },
      { header: "Payment status", key: "paymentStatus", width: 14 },
      { header: "Courier", key: "courier", width: 14 },
      { header: "Tracking #", key: "tracking", width: 18 },
    ],
    rows: orders.map((o) => {
      const cogs = o.items.reduce((s, i) => s + i.unitCost * i.quantity, 0);
      return {
        number: o.number,
        date: formatDateTime(o.createdAt),
        status: o.status,
        customer: o.customerName,
        phone: o.phone,
        email: o.email,
        city: o.city,
        items: o.items.map((i) => `${i.productName} (EU ${i.size}) x${i.quantity}`).join("; "),
        pairs: o.items.reduce((s, i) => s + i.quantity, 0),
        subtotal: o.subtotal,
        discount: o.discount,
        coupon: o.couponCode,
        shipping: o.shippingFee,
        total: o.total,
        cogs,
        profit: o.total - o.shippingFee - cogs,
        payment: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        courier: o.courier,
        tracking: o.trackingNumber,
      };
    }),
  };
}

async function expensesSheet(from: Date, to: Date): Promise<Sheet> {
  const rows = await db.expense.findMany({ where: { date: { gte: from, lt: to } }, orderBy: { date: "asc" }, include: { category: true } });
  return {
    name: "Expenses",
    columns: [
      { header: "Date", key: "date", width: 14 },
      { header: "Category", key: "category", width: 22 },
      { header: "Description", key: "description", width: 40 },
      { header: "Vendor", key: "vendor", width: 20 },
      { header: "Amount", key: "amount", money: true },
      { header: "Receipt", key: "receipt", width: 40 },
    ],
    rows: rows.map((e) => ({ date: pkDateInput(e.date), category: e.category.name, description: e.description, vendor: e.vendor, amount: e.amount, receipt: e.receiptUrl })),
  };
}

async function pnlSheet(year: number): Promise<Sheet> {
  const rows = await getMonthlyPnL(year);
  const tot = rows.reduce((a, r) => ({ orders: a.orders + r.orders, pairs: a.pairs + r.pairs, revenue: a.revenue + r.revenue, cogs: a.cogs + r.cogs, grossProfit: a.grossProfit + r.grossProfit, expenses: a.expenses + r.expenses, netProfit: a.netProfit + r.netProfit }), { orders: 0, pairs: 0, revenue: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 });
  const margin = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : "");
  return {
    name: `P&L ${year}`,
    columns: [
      { header: "Month", key: "month", width: 12 },
      { header: "Orders", key: "orders", width: 9 },
      { header: "Pairs sold", key: "pairs", width: 10 },
      { header: "Revenue", key: "revenue", money: true },
      { header: "Cost of goods", key: "cogs", money: true },
      { header: "Gross profit", key: "grossProfit", money: true },
      { header: "Expenses", key: "expenses", money: true },
      { header: "Net profit", key: "netProfit", money: true },
      { header: "Net margin", key: "margin", width: 11 },
    ],
    rows: [
      ...rows.map((r) => ({ month: `${r.month} ${year}`, orders: r.orders, pairs: r.pairs, revenue: r.revenue, cogs: r.cogs, grossProfit: r.grossProfit, expenses: r.expenses, netProfit: r.netProfit, margin: margin(r.netProfit, r.revenue) })),
      { month: `Total ${year}`, ...tot, margin: margin(tot.netProfit, tot.revenue) },
    ],
  };
}

async function subscribersSheet(): Promise<Sheet> {
  const subs = await db.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return { name: "Subscribers", columns: [{ header: "Email", key: "email", width: 32 }, { header: "Subscribed", key: "date", width: 20 }], rows: subs.map((s) => ({ email: s.email, date: formatDateTime(s.createdAt) })) };
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();
  const user = session ? await db.user.findUnique({ where: { id: session.userId }, select: { role: true } }) : null;
  if (!user || !isAdminRole(user.role)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await params;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const range = from && to ? resolveRange("custom", from, to) : resolveRange("month");
  const stamp = from && to ? (from.slice(0, 7) === to.slice(0, 7) ? from.slice(0, 7) : `${from}_to_${to}`) : pkDateInput(range.from).slice(0, 7);

  let sheet: Sheet;
  let name: string;
  if (type === "orders") {
    sheet = await ordersSheet(range.from, range.to);
    name = `montevro-orders-${stamp}`;
  } else if (type === "expenses") {
    sheet = await expensesSheet(range.from, range.to);
    name = `montevro-expenses-${stamp}`;
  } else if (type === "pnl") {
    const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
    sheet = await pnlSheet(year);
    name = `montevro-profit-loss-${year}`;
  } else if (type === "subscribers") {
    sheet = await subscribersSheet();
    name = `montevro-subscribers-${pkDateInput(new Date())}`;
  } else {
    return Response.json({ error: "Unknown report" }, { status: 404 });
  }

  if (format === "csv") {
    return new Response(toCsv(sheet), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"`, "Cache-Control": "no-store" },
    });
  }
  const buf = await toXlsx(sheet);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${name}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
