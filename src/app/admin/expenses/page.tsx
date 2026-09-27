import Link from "next/link";
import { Download, Paperclip, Pencil, Trash2 } from "lucide-react";
import { Card, EmptyState, Field, PageHeader, adminInput, smallBtn, td, th } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/forms";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { HBarList } from "@/components/admin/charts";
import { SERIES } from "@/components/admin/palette";
import { createExpense, deleteExpense, deleteExpenseCategory, saveExpenseCategory, updateExpense } from "@/lib/actions/admin-expenses";
import { db } from "@/lib/db";
import { pkDateInput, resolveRange } from "@/lib/analytics";
import { formatDate, pkr } from "@/lib/format";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const range = resolveRange(sp.range ?? "month", sp.from, sp.to);
  const [categories, expenses, editing] = await Promise.all([
    db.expenseCategory.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { expenses: true } } } }),
    db.expense.findMany({
      where: { date: { gte: range.from, lt: range.to }, ...(sp.category ? { categoryId: sp.category } : {}) },
      orderBy: { date: "desc" },
      include: { category: true },
    }),
    sp.edit ? db.expense.findUnique({ where: { id: sp.edit } }) : null,
  ]);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = new Map<string, number>();
  for (const e of expenses) byCat.set(e.category.name, (byCat.get(e.category.name) ?? 0) + e.amount);
  const today = pkDateInput(new Date());
  const toStr = pkDateInput(new Date(range.to.getTime() - 1));
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ range: sp.range, from: sp.from, to: sp.to, category: sp.category, ...extra })) if (v) p.set(k, v);
    return `/admin/expenses?${p.toString()}`;
  };

  const form = editing ?? undefined;

  return (
    <>
      <PageHeader
        title="Expenses"
        description={<>{range.label} · <b className="font-medium text-ink">{pkr(total)}</b> across {expenses.length} entr{expenses.length === 1 ? "y" : "ies"}</>}
        actions={
          <a className={smallBtn} href={`/api/admin/export/expenses?format=xlsx&from=${pkDateInput(range.from)}&to=${toStr}`}>
            <Download className="size-3.5" /> Export Excel
          </a>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeFilter current={range.preset} from={pkDateInput(range.from)} to={toStr} />
        <form action="/admin/expenses" className="flex gap-2">
          {sp.range && <input type="hidden" name="range" value={sp.range} />}
          {sp.from && <input type="hidden" name="from" value={sp.from} />}
          {sp.to && <input type="hidden" name="to" value={sp.to} />}
          <select name="category" defaultValue={sp.category ?? ""} className={`${adminInput} sm:w-56`} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="bg-ink px-4 text-xs font-medium uppercase tracking-[0.14em] text-ivory">Filter</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card bodyClassName="p-0 sm:p-0" title="Entries">
            {expenses.length === 0 ? (
              <EmptyState title="No expenses in this period">Add rent, materials, courier bills or ad spend to see true profit.</EmptyState>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead className="border-b border-line">
                    <tr>
                      <th className={th}>Date</th>
                      <th className={th}>Description</th>
                      <th className={th}>Category</th>
                      <th className={`${th} text-right`}>Amount</th>
                      <th className={th}><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {expenses.map((e) => (
                      <tr key={e.id} className={e.id === sp.edit ? "bg-cream/40" : ""}>
                        <td className={`${td} text-stone`}>{formatDate(e.date)}</td>
                        <td className={`${td} max-w-[280px] truncate`}>
                          {e.description}
                          {e.vendor && <span className="text-stone"> · {e.vendor}</span>}
                          {e.receiptUrl && (
                            <a href={e.receiptUrl} target="_blank" rel="noopener" className="ml-2 inline-flex items-center text-cognac" aria-label="View receipt">
                              <Paperclip className="size-3.5" />
                            </a>
                          )}
                        </td>
                        <td className={td}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="size-2 rounded-full" style={{ background: e.category.color ?? "#8a8178" }} aria-hidden />
                            {e.category.name}
                          </span>
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{pkr(e.amount)}</td>
                        <td className={`${td} text-right`}>
                          <div className="flex justify-end gap-1">
                            <Link href={qs({ edit: e.id })} className="p-1.5 text-stone hover:text-ink" aria-label="Edit"><Pencil className="size-3.5" /></Link>
                            <form action={deleteExpense}>
                              <input type="hidden" name="id" value={e.id} />
                              <ConfirmSubmit message="Delete this expense?" className="p-1.5 text-stone hover:text-danger" aria-label="Delete"><Trash2 className="size-3.5" /></ConfirmSubmit>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-ink">
                    <tr>
                      <td className={`${td} font-medium`} colSpan={3}>Total</td>
                      <td className={`${td} text-right font-medium tabular-nums`}>{pkr(total)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>
          <Card title="By category">
            <HBarList color={SERIES.s1} rows={[...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, sub: total ? `${Math.round((value / total) * 100)}%` : undefined }))} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={form ? "Edit expense" : "Add expense"} action={form ? <Link href={qs({ edit: undefined })} className="text-xs text-stone hover:text-ink">Cancel</Link> : null}>
            <ActionForm key={form?.id ?? "new"} action={form ? updateExpense : createExpense} resetOnSuccess={!form} className="space-y-3">
              {form && <input type="hidden" name="id" value={form.id} />}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (Rs.)"><input name="amount" type="number" min={1} step={1} required defaultValue={form?.amount} className={adminInput} inputMode="numeric" /></Field>
                <Field label="Date"><input name="date" type="date" required defaultValue={form ? pkDateInput(form.date) : today} className={adminInput} /></Field>
              </div>
              <Field label="Category">
                <select name="categoryId" required defaultValue={form?.categoryId} className={adminInput}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Description"><input name="description" required maxLength={200} defaultValue={form?.description} className={adminInput} placeholder="e.g. 20 sq ft black calf leather" /></Field>
              <Field label="Vendor / paid to (optional)"><input name="vendor" maxLength={100} defaultValue={form?.vendor ?? ""} className={adminInput} /></Field>
              <Field label="Receipt (optional)" hint="Photo or PDF, up to 8 MB">
                <input type="file" name="receipt" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-sm file:mr-3 file:border-0 file:bg-cream file:px-3 file:py-2 file:text-xs" />
              </Field>
              {form?.receiptUrl && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="removeReceipt" /> Remove current receipt
                </label>
              )}
              <SubmitButton className="w-full">{form ? "Save changes" : "Add expense"}</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Categories">
            <ul className="divide-y divide-line">
              {categories.map((c) => (
                <li key={c.id} className="py-2">
                  <details>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: c.color ?? "#8a8178" }} aria-hidden />
                        {c.name}
                      </span>
                      <span className="text-xs text-stone">{c._count.expenses} · edit</span>
                    </summary>
                    <div className="mt-2 space-y-2">
                      <ActionForm action={saveExpenseCategory} className="flex gap-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input name="name" defaultValue={c.name} className={adminInput} aria-label="Category name" />
                        <input name="color" type="color" defaultValue={c.color ?? "#8a8178"} className="h-[38px] w-12 border border-line" aria-label="Colour" />
                        <SubmitButton variant="small">Save</SubmitButton>
                      </ActionForm>
                      <ActionForm action={deleteExpenseCategory} confirm={`Delete “${c.name}”?`}>
                        <input type="hidden" name="id" value={c.id} />
                        <SubmitButton variant="danger">Delete</SubmitButton>
                      </ActionForm>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
            <ActionForm action={saveExpenseCategory} resetOnSuccess className="mt-3 flex gap-2 border-t border-line pt-3">
              <input name="name" required placeholder="New category" className={adminInput} aria-label="New category name" />
              <input name="color" type="color" defaultValue="#8a8178" className="h-[38px] w-12 border border-line" aria-label="Colour" />
              <SubmitButton variant="small">Add</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
