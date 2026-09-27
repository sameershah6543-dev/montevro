import type { Category, Product } from "@/generated/prisma/client";
import { Field, adminInput } from "./ui";

/** Shared field set for create + edit product forms (rendered inside an ActionForm). */
export function ProductFields({ product, categories }: { product?: Product; categories: Category[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name" className="sm:col-span-2">
        <input name="name" required defaultValue={product?.name} className={adminInput} maxLength={120} />
      </Field>
      <Field label="URL slug" hint="Leave blank to generate from the name">
        <input name="slug" defaultValue={product?.slug} className={adminInput} placeholder="classic-black-chelsea" />
      </Field>
      <Field label="Category">
        <select name="categoryId" required defaultValue={product?.categoryId ?? categories[0]?.id} className={adminInput}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Tagline" className="sm:col-span-2">
        <input name="tagline" defaultValue={product?.tagline ?? ""} className={adminInput} maxLength={160} />
      </Field>
      <Field label="Description" className="sm:col-span-2">
        <textarea name="description" required rows={5} defaultValue={product?.description} className={adminInput} />
      </Field>
      <Field label="Details" hint="One bullet per line" className="sm:col-span-2">
        <textarea name="details" rows={4} defaultValue={product?.details.join("\n")} className={adminInput} />
      </Field>
      <Field label="Colour">
        <input name="color" defaultValue={product?.color ?? ""} className={adminInput} placeholder="Black" />
      </Field>
      <Field label="Material">
        <input name="material" defaultValue={product?.material ?? ""} className={adminInput} placeholder="Full-grain cow leather" />
      </Field>
      <Field label="Price (Rs.)">
        <input name="price" type="number" min={1} step={1} required defaultValue={product?.price} className={adminInput} inputMode="numeric" />
      </Field>
      <Field label="Compare-at price (Rs.)" hint="Optional — shows a strike-through sale price">
        <input name="compareAtPrice" type="number" min={0} step={1} defaultValue={product?.compareAtPrice ?? ""} className={adminInput} inputMode="numeric" />
      </Field>
      <Field label="Cost per pair (Rs.)" hint="Used for profit reports — never shown to customers">
        <input name="costPrice" type="number" min={0} step={1} defaultValue={product?.costPrice ?? 0} className={adminInput} inputMode="numeric" />
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={product?.status ?? "ACTIVE"} className={adminInput}>
          <option value="ACTIVE">Active — visible in store</option>
          <option value="DRAFT">Draft — hidden</option>
          <option value="ARCHIVED">Archived — hidden</option>
        </select>
      </Field>
      <Field label="Search tags" hint="Comma-separated, e.g. chelsea, black, formal" className="sm:col-span-2">
        <input name="tags" defaultValue={product?.tags.join(", ")} className={adminInput} />
      </Field>
      <div className="flex flex-wrap gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={product?.featured} /> Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isNew" defaultChecked={product?.isNew} /> Mark as new
        </label>
      </div>
    </div>
  );
}
