import Link from "next/link";
import clsx from "clsx";
import { History, X } from "lucide-react";
import { Card, EmptyState, Field, PageHeader, adminInput, smallBtn, th } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { adjustInventory } from "@/lib/actions/admin-inventory";
import { db } from "@/lib/db";
import { formatDateTime, pkr } from "@/lib/format";

export const metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const lowOnly = sp.low === "1";
  const products = await db.product.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
    include: { variants: { orderBy: { size: "asc" } }, category: { select: { name: true } } },
  });
  const sizes = [...new Set(products.flatMap((p) => p.variants.map((v) => v.size)))].sort((a, b) => Number(a) - Number(b));
  const rows = lowOnly ? products.filter((p) => p.variants.some((v) => v.stock <= v.lowStockThreshold)) : products;

  const allVariants = products.flatMap((p) => p.variants.map((v) => ({ ...v, product: p })));
  const totalPairs = allVariants.reduce((s, v) => s + v.stock, 0);
  const stockValue = allVariants.reduce((s, v) => s + v.stock * v.product.costPrice, 0);
  const retailValue = allVariants.reduce((s, v) => s + v.stock * v.product.price, 0);
  const out = allVariants.filter((v) => v.stock === 0).length;
  const low = allVariants.filter((v) => v.stock > 0 && v.stock <= v.lowStockThreshold).length;

  const selected = sp.adjust ? allVariants.find((v) => v.id === sp.adjust) : undefined;
  const recent = selected
    ? await db.stockMovement.findMany({ where: { variantId: selected.id }, orderBy: { createdAt: "desc" }, take: 6 })
    : [];
  const keep = lowOnly ? "low=1&" : "";

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock by size. Tap a number to receive, remove or correct stock."
        actions={<Link href="/admin/inventory/history" className={smallBtn}><History className="size-3.5" /> Movement history</Link>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="border border-line bg-white p-4"><p className="text-[10.5px] uppercase tracking-[0.16em] text-stone">Pairs in stock</p><p className="mt-1 text-2xl tabular-nums">{totalPairs.toLocaleString()}</p></div>
        <div className="border border-line bg-white p-4"><p className="text-[10.5px] uppercase tracking-[0.16em] text-stone">Stock value (cost)</p><p className="mt-1 text-2xl tabular-nums">{pkr(stockValue)}</p><p className="text-xs text-stone">Retail {pkr(retailValue)}</p></div>
        <div className="border border-line bg-white p-4"><p className="text-[10.5px] uppercase tracking-[0.16em] text-stone">Low stock sizes</p><p className="mt-1 text-2xl tabular-nums text-warning">{low}</p></div>
        <div className="border border-line bg-white p-4"><p className="text-[10.5px] uppercase tracking-[0.16em] text-stone">Sold-out sizes</p><p className="mt-1 text-2xl tabular-nums text-danger">{out}</p></div>
      </div>

      {selected && (
        <Card
          className="mb-4 border-ink"
          title={`Adjust · ${selected.product.name} · EU ${selected.size}`}
          action={<Link href={`/admin/inventory${lowOnly ? "?low=1" : ""}`} aria-label="Close" className="p-1 text-stone hover:text-ink"><X className="size-4" /></Link>}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ActionForm action={adjustInventory} resetOnSuccess className="space-y-3">
              <input type="hidden" name="variantId" value={selected.id} />
              <p className="text-sm">
                Current stock: <b className="tabular-nums">{selected.stock}</b> pairs · SKU <span className="font-mono text-xs">{selected.sku}</span>
              </p>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Adjustment type">
                {[
                  ["in", "Stock in (+)"],
                  ["out", "Stock out (−)"],
                  ["set", "Set exact count"],
                ].map(([v, l], i) => (
                  <label key={v} className="flex cursor-pointer items-center justify-center border border-line px-2 py-2 text-center text-xs has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-ivory">
                    <input type="radio" name="mode" value={v} defaultChecked={i === 0} className="sr-only" /> {l}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <Field label="Quantity"><input name="quantity" type="number" min={0} max={9999} required className={adminInput} inputMode="numeric" /></Field>
                <Field label="Reason"><input name="reason" className={adminInput} placeholder="New batch from workshop / damaged / count" maxLength={200} /></Field>
              </div>
              <SubmitButton>Apply</SubmitButton>
            </ActionForm>
            <div>
              <p className="label">Recent movements</p>
              {recent.length === 0 ? (
                <p className="text-sm text-stone">None yet.</p>
              ) : (
                <ul className="divide-y divide-line text-sm">
                  {recent.map((m) => (
                    <li key={m.id} className="flex justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">{m.type.replace("_", " ").toLowerCase()} {m.reason && <span className="text-stone">· {m.reason}</span>}</span>
                      <span className="shrink-0 tabular-nums">
                        <span className={m.quantity > 0 ? "text-success" : "text-danger"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</span>
                        <span className="ml-2 text-stone">→ {m.balance}</span>
                        <span className="ml-2 hidden text-xs text-stone sm:inline">{formatDateTime(m.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex gap-1">
          <Link href="/admin/inventory" className={clsx("px-3 py-1.5", !lowOnly ? "bg-ink text-ivory" : "text-stone hover:text-ink")}>All</Link>
          <Link href="/admin/inventory?low=1" className={clsx("px-3 py-1.5", lowOnly ? "bg-ink text-ivory" : "text-stone hover:text-ink")}>Low stock only</Link>
        </div>
        <span className="flex items-center gap-3 text-xs text-stone">
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 bg-rose-100 ring-1 ring-rose-300" /> Sold out</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2.5 bg-amber-50 ring-1 ring-amber-300" /> At/below alert level</span>
        </span>
      </div>

      <Card bodyClassName="p-0 sm:p-0">
        {rows.length === 0 ? (
          <EmptyState title={lowOnly ? "Nothing is running low" : "No products"}>{lowOnly ? "Every size is above its alert level." : null}</EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line">
                <tr>
                  <th className={`${th} sticky left-0 z-10 bg-white`}>Product</th>
                  {sizes.map((s) => (
                    <th key={s} className={`${th} !px-1 text-center`}>{s}</th>
                  ))}
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="sticky left-0 z-10 max-w-[180px] bg-white px-4 py-2 text-sm sm:max-w-none sm:px-5">
                      <Link href={`/admin/products/${p.id}`} className="block truncate hover:text-cognac">{p.name}</Link>
                      <span className="text-xs text-stone">{p.category.name}</span>
                    </td>
                    {sizes.map((s) => {
                      const v = p.variants.find((x) => x.size === s);
                      if (!v) return <td key={s} className="px-1 py-2 text-center text-stone/50">·</td>;
                      const tone = v.stock === 0 ? "bg-rose-100 text-danger ring-rose-300" : v.stock <= v.lowStockThreshold ? "bg-amber-50 text-warning ring-amber-300" : "bg-white text-ink ring-line hover:ring-ink";
                      return (
                        <td key={s} className="px-1 py-2 text-center">
                          <Link
                            href={`/admin/inventory?${keep}adjust=${v.id}`}
                            scroll={false}
                            className={clsx("inline-grid h-9 min-w-10 place-items-center px-1.5 text-sm tabular-nums ring-1 ring-inset", tone, sp.adjust === v.id && "!ring-2 !ring-ink")}
                            aria-label={`${p.name} size ${s}: ${v.stock} in stock. Adjust`}
                          >
                            {v.stock}
                          </Link>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-right text-sm tabular-nums sm:px-5">{p.variants.reduce((a, v) => a + v.stock, 0)}</td>
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
