import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, EmptyState, PageHeader, adminInput, td, th } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import type { Prisma, StockMoveType } from "@/generated/prisma/client";

export const metadata = { title: "Stock history" };

const TYPES: Record<StockMoveType, string> = {
  STOCK_IN: "Stock in",
  STOCK_OUT: "Stock out",
  SALE: "Sale",
  RETURN: "Return",
  CANCEL_RESTOCK: "Cancelled — restocked",
  ADJUSTMENT: "Adjustment",
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const type = sp.type && sp.type in TYPES ? (sp.type as StockMoveType) : undefined;
  const where: Prisma.StockMovementWhereInput = {
    ...(type ? { type } : {}),
    ...(sp.product ? { variant: { productId: sp.product } } : {}),
  };
  const [moves, products] = await Promise.all([
    db.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { variant: { select: { size: true, sku: true, product: { select: { id: true, name: true } } } }, order: { select: { id: true, number: true } }, user: { select: { name: true } } },
    }),
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <Link href="/admin/inventory" className="mb-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-3.5" /> Inventory
      </Link>
      <PageHeader title="Stock movement history" description="Latest 100 movements — every sale, return, restock and adjustment." />
      <form className="mb-4 grid gap-3 sm:flex sm:items-center" action="/admin/inventory/history">
        <select name="product" defaultValue={sp.product ?? ""} className={`${adminInput} sm:max-w-xs`} aria-label="Filter by product">
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="type" defaultValue={type ?? ""} className={`${adminInput} sm:max-w-[200px]`} aria-label="Filter by type">
          <option value="">All types</option>
          {Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="bg-ink px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-ivory">Filter</button>
      </form>
      <Card bodyClassName="p-0 sm:p-0">
        {moves.length === 0 ? (
          <EmptyState title="No movements" />
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Product · size</th>
                  <th className={th}>Type</th>
                  <th className={`${th} text-right`}>Qty</th>
                  <th className={`${th} text-right`}>Balance</th>
                  <th className={th}>Reason</th>
                  <th className={th}>By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td className={`${td} text-stone`}>{formatDateTime(m.createdAt)}</td>
                    <td className={td}>
                      <Link href={`/admin/products/${m.variant.product.id}`} className="hover:text-cognac">{m.variant.product.name}</Link>
                      <span className="text-stone"> · EU {m.variant.size}</span>
                    </td>
                    <td className={td}>{TYPES[m.type]}</td>
                    <td className={`${td} text-right tabular-nums ${m.quantity > 0 ? "text-success" : "text-danger"}`}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                    <td className={`${td} text-right tabular-nums`}>{m.balance}</td>
                    <td className={`${td} max-w-[260px] truncate`}>
                      {m.order ? <Link href={`/admin/orders/${m.order.id}`} className="underline hover:text-cognac">{m.order.number}</Link> : null}
                      {m.order && m.reason ? " · " : ""}
                      {m.order ? <span className="text-stone">{m.reason?.replace(`Order ${m.order.number}`, "").trim()}</span> : m.reason}
                    </td>
                    <td className={`${td} text-stone`}>{m.user?.name ?? (m.order ? "Checkout" : "—")}</td>
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
