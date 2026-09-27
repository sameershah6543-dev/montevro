import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Card, EmptyState, Field, PageHeader, Pill, adminInput, td, th } from "@/components/admin/ui";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/forms";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/lib/actions/admin-misc";
import { db } from "@/lib/db";
import { pkDateInput } from "@/lib/analytics";
import { formatDate, pkr } from "@/lib/format";
import type { Coupon } from "@/generated/prisma/client";

export const metadata = { title: "Coupons" };

function couponState(c: Coupon) {
  const now = new Date();
  if (!c.active) return { tone: "neutral" as const, label: "Inactive" };
  if (c.endsAt && c.endsAt < now) return { tone: "bad" as const, label: "Expired" };
  if (c.startsAt && c.startsAt > now) return { tone: "warn" as const, label: "Scheduled" };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { tone: "bad" as const, label: "Used up" };
  return { tone: "good" as const, label: "Live" };
}

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const sp = await searchParams;
  const [coupons, discounts] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.order.groupBy({ by: ["couponCode"], where: { couponCode: { not: null }, status: { notIn: ["CANCELLED", "RETURNED"] } }, _sum: { discount: true, total: true } }),
  ]);
  const editing = sp.edit ? coupons.find((c) => c.id === sp.edit) : undefined;
  const stats = new Map(discounts.map((d) => [d.couponCode, d._sum]));

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can enter at checkout." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" bodyClassName="p-0 sm:p-0">
          {coupons.length === 0 ? (
            <EmptyState title="No coupons yet" />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="border-b border-line">
                  <tr>
                    <th className={th}>Code</th>
                    <th className={th}>Discount</th>
                    <th className={th}>Rules</th>
                    <th className={`${th} text-right`}>Used</th>
                    <th className={`${th} text-right`}>Sales / discount</th>
                    <th className={th}>Status</th>
                    <th className={th}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {coupons.map((c) => {
                    const s = couponState(c);
                    const st = stats.get(c.code);
                    return (
                      <tr key={c.id}>
                        <td className={`${td} font-mono font-medium`}>{c.code}</td>
                        <td className={td}>{c.type === "PERCENT" ? `${c.value}% off` : `${pkr(c.value)} off`}</td>
                        <td className={`${td} text-xs text-stone`}>
                          {c.minSubtotal ? `Min ${pkr(c.minSubtotal)}` : "No minimum"}
                          {(c.startsAt || c.endsAt) && <><br />{c.startsAt ? formatDate(c.startsAt) : "…"} – {c.endsAt ? formatDate(c.endsAt) : "…"}</>}
                        </td>
                        <td className={`${td} text-right tabular-nums`}>{c.usedCount}{c.maxUses !== null && <span className="text-stone"> / {c.maxUses}</span>}</td>
                        <td className={`${td} text-right text-xs tabular-nums`}>{st ? <>{pkr(st.total ?? 0)}<br /><span className="text-stone">−{pkr(st.discount ?? 0)}</span></> : "—"}</td>
                        <td className={td}><Pill tone={s.tone}>{s.label}</Pill></td>
                        <td className={td}>
                          <div className="flex items-center justify-end gap-1">
                            <form action={toggleCoupon}>
                              <input type="hidden" name="id" value={c.id} />
                              <button className="px-2 py-1 text-xs text-stone underline hover:text-ink">{c.active ? "Deactivate" : "Activate"}</button>
                            </form>
                            <Link href={`/admin/coupons?edit=${c.id}`} className="p-1.5 text-stone hover:text-ink" aria-label={`Edit ${c.code}`}><Pencil className="size-3.5" /></Link>
                            {c.usedCount === 0 && (
                              <form action={deleteCoupon}>
                                <input type="hidden" name="id" value={c.id} />
                                <ConfirmSubmit message={`Delete ${c.code}?`} className="p-1.5 text-stone hover:text-danger" aria-label={`Delete ${c.code}`}><Trash2 className="size-3.5" /></ConfirmSubmit>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title={editing ? `Edit ${editing.code}` : "New coupon"} action={editing ? <Link href="/admin/coupons" className="text-xs text-stone hover:text-ink">Cancel</Link> : null}>
          <ActionForm key={editing?.id ?? "new"} action={saveCoupon} resetOnSuccess={!editing} className="space-y-3">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <Field label="Code"><input name="code" required defaultValue={editing?.code} className={`${adminInput} font-mono uppercase`} placeholder="EID20" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select name="type" defaultValue={editing?.type ?? "PERCENT"} className={adminInput}>
                  <option value="PERCENT">Percent %</option>
                  <option value="FIXED">Fixed Rs.</option>
                </select>
              </Field>
              <Field label="Value"><input name="value" type="number" min={1} required defaultValue={editing?.value} className={adminInput} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Min. order (Rs.)"><input name="minSubtotal" type="number" min={0} defaultValue={editing?.minSubtotal ?? 0} className={adminInput} /></Field>
              <Field label="Max uses"><input name="maxUses" type="number" min={1} defaultValue={editing?.maxUses ?? ""} placeholder="Unlimited" className={adminInput} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts"><input name="startsAt" type="date" defaultValue={editing?.startsAt ? pkDateInput(editing.startsAt) : ""} className={adminInput} /></Field>
              <Field label="Ends"><input name="endsAt" type="date" defaultValue={editing?.endsAt ? pkDateInput(editing.endsAt) : ""} className={adminInput} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Active</label>
            <SubmitButton className="w-full">{editing ? "Save coupon" : "Create coupon"}</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
