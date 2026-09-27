import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Trash2, User } from "lucide-react";
import clsx from "clsx";
import { Card, Field, PageHeader, adminInput, smallBtn, th } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/forms";
import { ProductFields } from "@/components/admin/ProductFields";
import { addImages, addVariant, deleteProduct, deleteVariant, imageAction, saveVariants, updateProduct } from "@/lib/actions/admin-products";
import { db } from "@/lib/db";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories, orderCount] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }, variants: { orderBy: { size: "asc" } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.orderItem.count({ where: { productId: id } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <PageHeader
        title={product.name}
        description={sp.created ? "Product created — now add photos and check stock." : `${orderCount} order line${orderCount === 1 ? "" : "s"} · SKU prefix ${product.variants[0]?.sku.split("-").slice(0, 2).join("-") ?? "—"}`}
        actions={
          product.status === "ACTIVE" ? (
            <Link href={`/products/${product.slug}`} target="_blank" className={smallBtn}>
              <ExternalLink className="size-3.5" /> View in store
            </Link>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card title="Details">
            <ActionForm action={updateProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ProductFields product={product} categories={categories} />
              <div className="mt-5 flex justify-end">
                <SubmitButton pendingText="Saving…">Save product</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card title={`Sizes & stock (${product.variants.reduce((s, v) => s + v.stock, 0)} pairs)`} bodyClassName="p-0 sm:p-0">
            <ActionForm action={saveVariants}>
              <input type="hidden" name="productId" value={product.id} />
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead className="border-b border-line">
                    <tr>
                      <th className={th}>Size</th>
                      <th className={th}>SKU</th>
                      <th className={th}>In stock</th>
                      <th className={th}>Alert at ≤</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <td className="px-4 py-2 text-sm font-medium sm:px-5">EU {v.size}</td>
                        <td className="px-4 py-2 sm:px-5">
                          <input name={`sku_${v.id}`} defaultValue={v.sku} className={`${adminInput} min-w-36 font-mono text-xs`} aria-label={`SKU for size ${v.size}`} />
                        </td>
                        <td className="px-4 py-2 sm:px-5">
                          <input
                            name={`stock_${v.id}`}
                            type="number"
                            min={0}
                            defaultValue={v.stock}
                            className={clsx(adminInput, "w-24 tabular-nums", v.stock === 0 ? "border-rose-300" : v.stock <= v.lowStockThreshold ? "border-amber-300" : "")}
                            aria-label={`Stock for size ${v.size}`}
                          />
                        </td>
                        <td className="px-4 py-2 sm:px-5">
                          <input name={`threshold_${v.id}`} type="number" min={0} defaultValue={v.lowStockThreshold} className={`${adminInput} w-20`} aria-label={`Low-stock alert for size ${v.size}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-stone">Stock edits are logged as adjustments in inventory history.</p>
                <SubmitButton variant="small">Save sizes & stock</SubmitButton>
              </div>
            </ActionForm>
            {product.variants.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 sm:px-5">
                <span className="self-center text-xs text-stone">Remove size:</span>
                {product.variants.map((v) => (
                  <form key={v.id} action={deleteVariant}>
                    <input type="hidden" name="variantId" value={v.id} />
                    <ConfirmSubmit message={`Remove size EU ${v.size}? Its stock history is deleted too.`} className="border border-line px-2 py-1 text-xs text-stone hover:border-danger hover:text-danger">
                      {v.size} ×
                    </ConfirmSubmit>
                  </form>
                ))}
              </div>
            )}
            <ActionForm action={addVariant} resetOnSuccess className="border-t border-line px-4 py-4 sm:px-5">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                <Field label="New size (EU)"><input name="size" required placeholder="46" className={adminInput} /></Field>
                <Field label="Opening stock"><input name="stock" type="number" min={0} defaultValue={0} className={adminInput} /></Field>
                <Field label="SKU (optional)"><input name="sku" className={adminInput} /></Field>
                <SubmitButton variant="small">Add size</SubmitButton>
              </div>
            </ActionForm>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={`Images (${product.images.length})`}>
            {product.images.length === 0 && <p className="mb-3 text-sm text-stone">No images yet — the first image is the main product photo.</p>}
            <ul className="grid grid-cols-2 gap-3">
              {product.images.map((img, i) => (
                <li key={img.id} className="border border-line">
                  <div className="relative aspect-[4/5] bg-cream">
                    <Image src={img.url} alt={img.alt ?? ""} fill sizes="200px" className="object-cover" unoptimized={img.url.startsWith("http")} />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 bg-ink px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ivory">Main</span>}
                    {img.isModel && <span className="absolute right-1.5 top-1.5 bg-ivory px-1.5 py-0.5 text-[10px] uppercase tracking-wider">Model</span>}
                  </div>
                  <form action={imageAction} className="flex items-center justify-between gap-0.5 p-1">
                    <input type="hidden" name="imageId" value={img.id} />
                    <button name="op" value="up" disabled={i === 0} className="p-1.5 text-stone hover:text-ink disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="size-3.5" /></button>
                    <button name="op" value="down" disabled={i === product.images.length - 1} className="p-1.5 text-stone hover:text-ink disabled:opacity-30" aria-label="Move later"><ArrowDown className="size-3.5" /></button>
                    <button name="op" value="model" className={clsx("p-1.5 hover:text-ink", img.isModel ? "text-cognac" : "text-stone")} aria-label="Toggle model / lifestyle shot" title="Model / lifestyle shot"><User className="size-3.5" /></button>
                    <ConfirmSubmit name="op" value="delete" message="Delete this image?" className="p-1.5 text-stone hover:text-danger" aria-label="Delete image"><Trash2 className="size-3.5" /></ConfirmSubmit>
                  </form>
                </li>
              ))}
            </ul>
            <ActionForm action={addImages} resetOnSuccess className="mt-4 space-y-3 border-t border-line pt-4">
              <input type="hidden" name="productId" value={product.id} />
              <Field label="Upload photos" hint="JPG, PNG or WEBP · up to 8 MB each">
                <input type="file" name="files" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-ivory" />
              </Field>
              <Field label="…or image URL">
                <input name="url" className={adminInput} placeholder="https://…" />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isModel" /> Model / lifestyle shot (someone wearing the shoes)
              </label>
              <SubmitButton variant="small" className="w-full" pendingText="Uploading…">Add images</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Danger zone">
            <p className="mb-3 text-sm text-stone">
              {orderCount > 0 ? "This product has orders, so it will be archived (hidden) rather than deleted, keeping your sales history intact." : "Permanently delete this product, its images and sizes."}
            </p>
            <ActionForm action={deleteProduct} confirm={orderCount > 0 ? "Archive this product?" : "Permanently delete this product?"}>
              <input type="hidden" name="id" value={product.id} />
              <SubmitButton variant="danger" className="w-full">{orderCount > 0 ? "Archive product" : "Delete product"}</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
