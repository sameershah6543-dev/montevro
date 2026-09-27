import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, Field, PageHeader, adminInput } from "@/components/admin/ui";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { ProductFields } from "@/components/admin/ProductFields";
import { createProduct } from "@/lib/actions/admin-products";
import { db } from "@/lib/db";
import { site } from "@/lib/site";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-stone hover:text-ink">
        <ArrowLeft className="size-3.5" /> Products
      </Link>
      <PageHeader title="New product" description="Images can be added after saving." />
      <ActionForm action={createProduct} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Details" className="xl:col-span-2">
          <ProductFields categories={categories} />
        </Card>
        <div className="space-y-4">
          <Card title="Sizes">
            <p className="mb-3 text-sm text-stone">Pick the EU sizes this shoe comes in.</p>
            <div className="grid grid-cols-4 gap-2">
              {["38", ...site.sizes, "46"].map((s) => (
                <label key={s} className="flex items-center justify-center gap-1.5 border border-line py-2 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-ivory">
                  <input type="checkbox" name="sizes" value={s} defaultChecked={site.sizes.includes(s)} className="sr-only" /> {s}
                </label>
              ))}
            </div>
            <Field label="Opening stock per size" className="mt-4">
              <input name="initialStock" type="number" min={0} max={999} defaultValue={0} className={adminInput} />
            </Field>
          </Card>
          <SubmitButton className="w-full" pendingText="Creating…">Create product</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
