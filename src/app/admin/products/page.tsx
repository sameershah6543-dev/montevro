import Image from "next/image";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Card, EmptyState, PageHeader, Pill, adminInput, primaryBtn, td, th } from "@/components/admin/ui";
import { db } from "@/lib/db";
import { pkr } from "@/lib/format";
import type { Prisma, ProductStatus } from "@/generated/prisma/client";

export const metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = ["ACTIVE", "DRAFT", "ARCHIVED"].includes(sp.status ?? "") ? (sp.status as ProductStatus) : undefined;
  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { variants: { some: { sku: { contains: q, mode: "insensitive" } } } }] } : {}),
  };
  const products = await db.product.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true, variants: { select: { stock: true, lowStockThreshold: true } } },
  });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}`}
        actions={<Link href="/admin/products/new" className={primaryBtn}><Plus className="size-3.5" /> Add product</Link>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative w-full sm:max-w-xs" action="/admin/products">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Name or SKU" className={`${adminInput} pl-9`} aria-label="Search products" />
        </form>
        <div className="flex gap-1 text-sm">
          {[undefined, "ACTIVE", "DRAFT", "ARCHIVED"].map((s) => (
            <Link key={s ?? "all"} href={`/admin/products${s ? `?status=${s}` : ""}`} className={`px-3 py-1.5 ${status === s ? "bg-ink text-ivory" : "text-stone hover:text-ink"}`}>
              {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
            </Link>
          ))}
        </div>
      </div>

      <Card bodyClassName="p-0 sm:p-0">
        {products.length === 0 ? (
          <EmptyState title="No products">Add your first product to start selling.</EmptyState>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Category</th>
                  <th className={`${th} text-right`}>Price</th>
                  <th className={`${th} text-right`}>Cost</th>
                  <th className={`${th} text-right`}>Margin</th>
                  <th className={`${th} text-right`}>Stock</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => {
                  const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                  const low = p.variants.filter((v) => v.stock <= v.lowStockThreshold).length;
                  const margin = p.price ? ((p.price - p.costPrice) / p.price) * 100 : 0;
                  return (
                    <tr key={p.id} className="hover:bg-[#faf8f5]">
                      <td className={td}>
                        <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 hover:text-cognac">
                          <span className="relative size-11 shrink-0 overflow-hidden bg-cream">
                            {p.images[0] && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" unoptimized={p.images[0].url.startsWith("http")} />}
                          </span>
                          <span className="font-medium">{p.name}</span>
                        </Link>
                      </td>
                      <td className={`${td} text-stone`}>{p.category.name}</td>
                      <td className={`${td} text-right tabular-nums`}>{pkr(p.price)}</td>
                      <td className={`${td} text-right tabular-nums text-stone`}>{p.costPrice ? pkr(p.costPrice) : "—"}</td>
                      <td className={`${td} text-right tabular-nums`}>{p.costPrice ? `${margin.toFixed(0)}%` : "—"}</td>
                      <td className={`${td} text-right tabular-nums`}>
                        {stock}
                        {low > 0 && <span className="ml-2 text-xs text-warning">{low} low</span>}
                      </td>
                      <td className={td}>
                        <Pill tone={p.status === "ACTIVE" ? "good" : p.status === "DRAFT" ? "warn" : "neutral"}>{p.status.toLowerCase()}</Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
